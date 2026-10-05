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
import { setSessionTokenCookie } from "../utils/session";

export const signInAction = async (payload: TSignInSchema) => {
    try {
        const global = MESSAGE.GLOBAL;
        const message = MESSAGE.AUTH;
        const { email, password } = payload;
        const { data } = await findUserByEmailService(email);
        if (!data) throw new ApiError(status.UNAUTHORIZED, global.UNAUTHORIZED);
        if (!data.verifiedAt) throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_NOT_VERIFIED);
        if (data.status !== "ACTIVE") throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_NOT_ACTIVE);
        const isPasswordValid = await verifyPasswordHash(data.password, password);
        if (!isPasswordValid) throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_INCORRECT);
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
        // Keamanan: pendaftaran publik hanya USER/PETUGAS (tanpa jabatan - diisi admin kemudian); ADMIN tidak boleh lewat pendaftaran publik
        const { jabatan: _jabatan, ...safePayload } = payload;
        const roleAman = safePayload.role === "PETUGAS" ? "PETUGAS" : "USER";
        const user = await createUserService({ ...safePayload, role: roleAman } as TCreateUserSchema);
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
        const { data } = await findUserByEmailService(parsed.email);
        if (!data) throw new ApiError(status.BAD_REQUEST, message.EMAIL_NOT_FOUND);
        const { data: fp } = await createForgotPasswordService(data.userId);

        // Kirim email berisi tautan reset (sebelumnya hanya komentar //EMAIL - tidak pernah diimplementasikan)
        try {
            const resetUrl = `${process.env.APP_URL}/lupa-password/${fp.forgotPasswordId}`;
            const html = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
                    <h2>🔐 Reset Password</h2>
                    <p>Anda (atau seseorang) meminta pengaturan ulang password akun Desa Sukamaju Anda.</p>
                    <p style="text-align:center;margin:24px 0;">
                        <a href="${resetUrl}" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                            Atur Password Baru
                        </a>
                    </p>
                    <p style="font-size:12px;color:#888;">Tautan berlaku 1 jam dan hanya bisa digunakan sekali. Abaikan email ini jika Anda tidak meminta reset.</p>
                </div>`;
            await sendEmail(data.email, "🔐 Reset Password - Desa Sukamaju", html);
            console.log(`[LUPA PASSWORD] Email reset terkirim ke ${data.email}`);
        } catch (e) {
            console.error("GAGAL EMAIL RESET:", e);
        }

        return { status: status.OK, message: message.FORGOT_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const resetPasswordAction = async (payload: TResetPasswordSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const parsed = resetPasswordSchema.parse(payload);
        const { data: forgotPassword } = await validateForgotPasswordService(parsed.forgotPasswordId);
        await updateUserPasswordService(forgotPassword.userId, parsed.password);
        await consumeForgotPasswordService(forgotPassword.forgotPasswordId);
        return { status: status.OK, message: message.FORGOT_OK };
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
