"use server";

import { rateLimit } from "@/lib/server/utils/rate-limit";
import { getClientIp } from "@/lib/server/utils/client-info";

// Publik (tanpa login) -> rate limit ketat per IP cegah abuse bot Sociomile.
// 5 permintaan / 15 menit per IP (setara rate limit signIn).
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export type CekBansosPublikResult = {
    ok: boolean;
    detail?: string;
    error?: string;
};

/**
 * Cek bantuan + desil publik via chatbot Sociomile (MINSOS).
 * Dipanggil dari popup CekBansosDialog (Beranda publik, tanpa login).
 *
 * Validasi NIK 16 digit + rate-limit per IP. Hasil = jawaban terakhir bot (detail bansos),
 * atau pesan error jelas (NIK salah / layanan offline / terlalu banyak permintaan).
 */
export async function cekBansosPublikAction(nik: string): Promise<CekBansosPublikResult> {
    // Validasi NIK: harus 16 digit angka (defense-in-depth; client juga validasi).
    const trimmed = (nik || "").trim();
    if (!/^\d{16}$/.test(trimmed)) {
        return { ok: false, error: "NIK harus 16 digit angka." };
    }

    // Rate limit per IP (publik -> cegah spam bot Sociomile).
    const ip = await getClientIp();
    const key = `cek-bansos-publik:ip:${ip}`;
    const check = rateLimit(key, LIMIT, WINDOW_MS);
    if (!check.allowed) {
        const retryMin = Math.max(1, Math.ceil((check as any).retryAfterMs / 60000));
        return { ok: false, error: `Terlalu banyak permintaan. Coba lagi dalam ${retryMin} menit.` };
    }

    try {
        const { fetchDetailBansosByNik } = await import("@/lib/server/services/sociomile-bansos");
        const detail = await fetchDetailBansosByNik(trimmed);
        return { ok: true, detail };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // NIK ditolak bot -> pesan jelas ke user.
        if (/nik.*(salah|ditolak|tidak ditemukan)|input.*16.*digit.*nik/i.test(msg)) {
            return { ok: false, error: "NIK tidak ditemukan di database Kemensos. Periksa kembali NIK Anda." };
        }
        // Sociomile gangguan / offline / network.
        if (/HTTP|tidak memberikan balasan|Tidak terjangkau|fetch failed|network/i.test(msg)) {
            return { ok: false, error: "Layanan cek bansos sedang tidak tersedia (bot offline / gangguan jaringan). Coba lagi nanti." };
        }
        return { ok: false, error: "Gagal memeriksa bansos. Silakan coba lagi." };
    }
}
