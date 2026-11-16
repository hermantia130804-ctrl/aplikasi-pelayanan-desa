/**
 * Rate limiter sederhana in-memory (fixed-window).
 *
 * Tujuan: melindungi endpoint sensitif (signIn, forgotPassword) dari brute-force
 * dan user-enumeration dengan time-based throttling.
 *
 * CATATAN PENTING (Vercel serverless):
 *   Bucket disimpan di memori instance Node.js. Pada Vercel serverless,
 *   setiap instance fungsi memiliki memori sendiri, sehingga limiter ini bekerja
 *   per-instance (per cold start). Ini masih memberi proteksi nyata karena
 *   permintaan berulang dari attacker biasanya mengenai instance yang sama
 *   selama masih hangat, namun BUKAN pengganti rate limiter terdistribusi.
 *
 *   Untuk proteksi brute-force lintas-instance yang kuat (production-grade),
 *   gunakan Vercel KV / Upstash Redis (@upstash/ratelimit) atau edge middleware
 *   rate limiting. Lihat: https://vercel.com/docs/limits/rate-limits
 *
 * Trade-off yang disengaja:
 *   - Sederhana, tanpa dependensi eksternal, tanpa biaya, tanpa latensi jaringan.
 *   - Cukup untuk menutup celah "tanpa rate limit sama sekali" (issue #10).
 */

interface Bucket {
    count: number;
    resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

// Batas atas jumlah bucket untuk mencegah memory leak pada instance yang sangat sibuk.
// Praktik: bersihkan entry expired saat ukuran melewati ambang ini.
const MAX_BUCKETS = 10_000;

export type RateLimitResult = {
    /** true jika request boleh diproses, false jika melebihi limit */
    allowed: boolean;
    /** sisa permintaan yang tersisa di window saat ini */
    remaining: number;
    /** ms sampai window direset (0 jika allowed) */
    retryAfterMs: number;
};

/**
 * Cek dan catat percobaan untuk key tertentu.
 *
 * @param key     Pengelompokan percobaan (mis. `signin:ip:1.2.3.4` atau `signin:email:x@y.com`)
 * @param limit   Maksimum percobaan dalam window
 * @param windowMs Panjang window dalam ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        // Window baru — reset counter.
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        evictExpired(now);
        return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
    }

    existing.count += 1;
    const allowed = existing.count <= limit;
    return {
        allowed,
        remaining: Math.max(0, limit - existing.count),
        retryAfterMs: allowed ? 0 : existing.resetAt - now,
    };
}

/**
 * Reset counter untuk key tertentu — panggil setelah aksi BERHASIL
 * (mis. login sukses) agar user yang sah tidak terblokir oleh attempt gagal lampau.
 */
export function resetRateLimit(key: string): void {
    buckets.delete(key);
}

/** Bersihkan entry yang window-nya sudah lewat. */
function evictExpired(now: number): void {
    if (buckets.size < MAX_BUCKETS) return;
    for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
    }
}
