"use server"

import { MESSAGE } from "@/constants/message";
import { emailVerificationSchema, forgotPasswordSchema, resetPasswordSchema, TEmailVerificationSchema, TForgotPasswordSchema, TResetPasswordSchema, TSignInSchema } from "@/lib/validators/auth";
import { TCreateUserSchema } from "@/lib/validators/user";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { consumeEmailVerificationService, createEmailVerificationService, validateEmailVerificationService } from "../services/email-verification";
import { errorHandler } from "../services/error";
import { consumeForgotPasswordService, createForgotPasswordService, validateForgotPasswordService } from "../services/forgot-password";
import { createSessionService, findCurrentSessionService, invalidateSessionService } from "../services/session";
import { activateUserService, createUserService, findUserByEmailService, updateUserAsVerifiedService, updateUserPasswordService } from "../services/user";
import { sendEmail } from "../utils/email";
import { verifyPasswordHash } from "../utils/password";
import { deleteSessionTokenCookie, setSessionTokenCookie } from "../utils/session";
import { getClientIp } from "../utils/client-info";
import { rateLimit, resetRateLimit } from "../utils/rate-limit";

// Konfigurasi rate limit untuk signIn (#10).
// - 5 percobaan / 15 menit per IP  → cegah brute-force dari satu sumber.
// - 5 percobaan / 15 menit per email → cegah password-spray lintas IP ke satu akun.
// Reset counter setelah login berhasil agar user sah tidak terkunci.
const SIGNIN_LIMIT = 5;
const SIGNIN_WINDOW_MS = 15 * 60 * 1000;

export const signInAction = async (payload: TSignInSchema) => {
    try {
        const global = MESSAGE.GLOBAL;
        const message = MESSAGE.AUTH;
        const { email, password } = payload;

        // ===== Rate limit (#10) =====
        // Cek DULU sebelum menyentuh DB, agar attacker yang membanjiri endpoint
        // punya response cepat dan tidak membebani database.
        const ip = await getClientIp();
        const emailKey = `signin:email:${email.toLowerCase()}`;
        const ipKey = `signin:ip:${ip}`;
        const ipCheck = rateLimit(ipKey, SIGNIN_LIMIT, SIGNIN_WINDOW_MS);
        const emailCheck = rateLimit(emailKey, SIGNIN_LIMIT, SIGNIN_WINDOW_MS);
        if (!ipCheck.allowed || !emailCheck.allowed) {
            const retryAfterMs = Math.max(ipCheck.retryAfterMs, emailCheck.retryAfterMs);
            const retryAfterMin = Math.max(1, Math.ceil(retryAfterMs / 60000));
            throw new ApiError(
                status.TOO_MANY_REQUESTS,
                `Terlalu banyak percobaan masuk. Coba lagi dalam ${retryAfterMin} menit.`
            );
        }

        const { data } = await findUserByEmailService(email);
        if (!data) throw new ApiError(status.UNAUTHORIZED, global.UNAUTHORIZED);
        if (!data.verifiedAt) throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_NOT_VERIFIED);
        if (data.status !== "ACTIVE") throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_NOT_ACTIVE);
        const isPasswordValid = await verifyPasswordHash(data.password, password);
        if (!isPasswordValid) throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_INCORRECT);

        // Login berhasil: reset counter rate limit agar user sah bersih lagi.
        resetRateLimit(ipKey);
        resetRateLimit(emailKey);

        const session = await createSessionService(data.userId);
        await setSessionTokenCookie(session.data.sessionId, session.data.expiresAt);
        return { status: status.OK, message: message.SIGN_IN_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const signUpAction = async (payload: TCreateUserSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const { data } = await findUserByEmailService(payload.email);
        if (data) throw new ApiError(status.BAD_REQUEST, message.SIGN_UP_ALREADY_EXISTS);
        // ===== Keamanan (#2) =====
        // Pendaftaran publik WAJIB role=USER. PETUGAS / ADMIN / RT hanya boleh
        // di-assign oleh admin lewat halaman pengguna (updateUserRoleService).
        // Whitelist field yang boleh lewat; abaikan field lain (role, jabatan,
        // noRt, noRw, namaKetua, alamatRt, status, verifiedAt) yang mungkin
        // di-inject klien via cast `as` di form (sign-up-form.tsx). Pertahanan
        // berlapis di sisi server — tidak peduli apa yang dikirim form.
        const user = await createUserService({
            email: payload.email,
            nik: payload.nik,
            name: payload.name,
            password: payload.password,
            address: payload.address,
            phone: payload.phone,
            role: "USER",
        } as TCreateUserSchema);
        await createEmailVerificationService(user.data.userId);
        return { status: status.OK, message: message.SIGN_UP_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const signOutAction = async () => {
    try {
        const global = MESSAGE.GLOBAL;
        const message = MESSAGE.AUTH;
        const session = await findCurrentSessionService();
        // Hapus cookie SELALU — bahkan jika sesi sudah tidak ditemukan di DB,
        // agar browser benar-benar lepas dari cookie lama (#7).
        await deleteSessionTokenCookie();
        if (!session) throw new ApiError(status.UNAUTHORIZED, global.UNAUTHORIZED);
        await invalidateSessionService(session.session.sessionId);
        return { status: status.OK, message: message.SIGN_OUT_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const forgotPasswordAction = async (payload: TForgotPasswordSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const parsed = forgotPasswordSchema.parse(payload);

        // ===== Anti user-enumeration (#11) =====
        // Kirim pesan sukses yang SAMA persis baik email ada maupun tidak.
        // Tidak ada lagi error "Email tidak terdaftar" yang bocor ke attacker.
        // Jika email tidak ada, kita tetap return OK tanpa benar-benar kirim email.
        const GENERIC_OK_MSG = message.FORGOT_OK + " Cek email Anda (termasuk folder Spam) untuk tautan reset.";

        const { data } = await findUserByEmailService(parsed.email);
        if (!data) {
            // Jangan bocorkan bahwa email tidak terdaftar.
            // Tidak perlu kirim email apa-apa; tetap return pesan sukses generik.
            return { status: status.OK, message: GENERIC_OK_MSG };
        }

        const { data: fp } = await createForgotPasswordService(data.userId);

        const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
        const resetUrl = `${appUrl}/lupa-password/${fp.forgotPasswordId}`;

        try {
            const html = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
                    <h2>Reset Password</h2>
                    <p>Anda (atau seseorang) meminta pengaturan ulang password akun Desa Sukamaju Anda.</p>
                    <p style="text-align:center;margin:24px 0;">
                        <a href="${resetUrl}" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                            Atur Password Baru
                        </a>
                    </p>
                    <p style="font-size:12px;color:#888;">
                        Tautan berlaku 1 jam dan hanya bisa digunakan sekali.
                        Abaikan email ini jika Anda tidak meminta reset.
                    </p>
                </div>`;
            await sendEmail(data.email, "Reset Password - Desa Sukamaju", html);
            // ===== Jangan log reset URL (#11) =====
            // Log hanya event + tujuan email (email sendiri bukan rahasia),
            // TANPA menyertakan token reset. Token di log Vercel bisa dibaca
            // orang yang punya akses log → punya URL reset valid.
            console.log(`[LUPA PASSWORD] Email reset terkirim ke ${data.email}`);
        } catch (e) {
            // Jangan bocorkan URL reset ke log bahkan saat gagal kirim.
            // Hanya log pesan error umum + email tujuan (bukan token).
            const errMsg = e instanceof Error ? e.message : String(e);
            console.error(`[LUPA PASSWORD] GAGAL kirim email reset ke ${data.email}:`, errMsg);
            // Catatan: sebelumnya URL reset (berisi token) di-log di sini sebagai
            // "fallback admin". Praktik itu berbahaya — jika butuh manual reset,
            // admin harus pakai endpoint internal terpisah, bukan baca dari log.
        }

        // Pesan ke user selalu generik agar tidak membocorkan apakah email benar-benar dikirim.
        // (Email mungkin gagal terkirim karena masalah SMTP; user tetap disuruh cek spam.)
        return { status: status.OK, message: GENERIC_OK_MSG };
    } catch (error) {
        return errorHandler(error);
    }
}

export const resetPasswordAction = async (payload: TResetPasswordSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const parsed = resetPasswordSchema.parse(payload);
        const { data: forgotPassword } = await validateForgotPasswordService(parsed.forgotPasswordId);
        // Validasi kekuatan password (defensif: tidak memblokir kalau HIBP unreachable).
        const { verifyPasswordStrength } = await import("../utils/password");
        const isKuat = await verifyPasswordStrength(parsed.password);
        if (!isKuat) throw new ApiError(status.BAD_REQUEST, "Password minimal 8 karakter dan tidak termasuk password yang bocor secara umum");
        await updateUserPasswordService(forgotPassword.userId, parsed.password);
        await consumeForgotPasswordService(forgotPassword.forgotPasswordId);
        return { status: status.OK, message: message.RESET_PASSWORD_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const emailVerificationAction = async (payload: TEmailVerificationSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const parsed = emailVerificationSchema.parse(payload);
        const { data } = await findUserByEmailService(parsed.email);
        if (!data) throw new ApiError(status.BAD_REQUEST, message.EMAIL_NOT_FOUND);
        await createEmailVerificationService(data.userId);
        //EMAIL
        return { status: status.OK, message: message.EMAIL_VERIFICATION_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const validateEmailVerificationAction = async (id: string) => {
    try {
        const message = MESSAGE.AUTH;
        const { data } = await validateEmailVerificationService(id);
        await updateUserAsVerifiedService(data.userId);
        await activateUserService(data.userId);
        await consumeEmailVerificationService(data.emailVerificationId);
        return { status: status.OK, message: message.EMAIL_VERIFICATION_OK };
    } catch (error) {
        return errorHandler(error);
    }
};
