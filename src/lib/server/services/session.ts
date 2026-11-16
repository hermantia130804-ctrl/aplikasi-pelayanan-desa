import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { generateSessionId, generateSessionToken } from "../utils/session";
import { cache } from "react";

/**
 * Manajemen sesi dengan pola "token di cookie, hash di DB".
 *
 * KEAMANAN (#13): sebelumnya `sessionId` di DB berisi `id + "." + secret`
 * (token plaintext). Jika DB bocor, attacker langsung punya cookie valid
 * → dapat login sebagai user manapun. Sekarang:
 *   - Cookie = `token` (random 20-byte base32, tidak disimpan di DB)
 *   - DB `sessionId` (@id) = sha256(token) — hanya hash yang disimpan
 *   - DB `secretHash` tidak terpakai lagi (kolom tetap dipertahankan agar
 *     tidak perlu migrasi schema; diisi string kosong)
 *
 * Konsekuensi: semua sesi lama (plaintext) otomatis invalid setelah deploy
 * ini — user harus login ulang sekali. Ini trade-off yang disengaja untuk
 * menutup celah kebocoran DB.
 *
 * Catatan: fungsi `invalidateSessionService` menerima DB id (hash) yang
 * didapat dari `findCurrentSessionService().session.sessionId`, BUKAN token
 * mentah dari cookie.
 */

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 jam

export const createSessionService = async (userId: string) => {
    // token = nilai yang akan disimpan di cookie (tidak pernah masuk DB).
    const token = generateSessionToken();
    // sessionId = sha256(token) — primary key di DB untuk lookup.
    const sessionId = generateSessionId(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    // secretHash tidak terpakai lagi; kolom NOT NULL → diisi string kosong.
    const data = await prisma.session.create({
        data: { userId, sessionId, secretHash: "", expiresAt },
    });
    // Kembalikan token sebagai `sessionId` agar auth.ts menaruhnya di cookie.
    // (Field lain dari `data` tidak dipakai oleh caller.)
    return { data: { ...data, sessionId: token } };
}

export const validateSessionService = async (token: string) => {
    if (!token) return { data: null };
    const sessionId = generateSessionId(token);
    const data = await prisma.session.findUnique({
        where: { sessionId },
        include: { user: true },
    });
    if (!data) return { data: null };
    if (data.expiresAt < new Date()) return { data: null };
    const { user, ...session } = data;
    return { data: { user, session } };
}

/**
 * Hapus sesi berdasarkan DB id (hash). Abaikan error jika sudah terhapus
 * (mis. cookie ada tapi record sudah dibersihkan oleh job expiry).
 */
export const invalidateSessionService = async (sessionId: string) => {
    if (sessionId) {
        await prisma.session.delete({ where: { sessionId } }).catch(() => {});
    }
    return { data: true };
}

export const invalidateUserSessionsService = async (userId: string) => {
    await prisma.session.deleteMany({ where: { userId } });
    return { data: true };
}

/**
 * Hapus SEMUA sesi user KECUALI sesi saat ini (currentSessionId = DB id/hash).
 * Dipakai setelah ubah password agar device lain dipaksa login ulang, sementara
 * device yang melakukan perubahan tetap aktif (#14).
 */
export const invalidateOtherSessionsService = async (userId: string, currentSessionId: string) => {
    if (!currentSessionId) {
        // Fallback: jika tidak ada sesi saat ini, hapus semua.
        await prisma.session.deleteMany({ where: { userId } });
    } else {
        await prisma.session.deleteMany({
            where: { userId, NOT: { sessionId: currentSessionId } },
        });
    }
    return { data: true };
}

export const findCurrentSessionService = cache(async () => {
    const store = await cookies();
    const token = store.get("session")?.value ?? null;
    if (token === null) return null;
    const result = await validateSessionService(token);
    return result.data;
})
