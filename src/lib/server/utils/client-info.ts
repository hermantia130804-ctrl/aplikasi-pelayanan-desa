import { headers } from "next/headers";

/**
 * Ambil alamat IP klien untuk keperluan rate limiting & logging (tanpa data sensitif).
 *
 * Pada Vercel (dan reverse-proxy umumnya), IP klien asli ada di header
 * `x-forwarded-for` (daftar comma-separated: client, proxy1, proxy2, ...).
 * Kita ambil entri pertama. Fallback ke `x-real-ip` atau "unknown".
 *
 * Catatan: IP bisa dipalsukan di lingkungan non-proxy, tapi pada Vercel
 * `x-forwarded-for` diisi oleh edge network Vercel dan dapat dipercaya
 * untuk throttling (bukan untuk identifikasi kuat).
 */
export async function getClientIp(): Promise<string> {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }
    return h.get("x-real-ip") ?? "unknown";
}
