import { hash, verify } from "@node-rs/argon2";
import { sha1 } from "@oslojs/crypto/sha1";
import { encodeHexLowerCase } from "@oslojs/encoding";

export async function hashPassword(password: string): Promise<string> {
        return await hash(password, {
                memoryCost: 19456,
                timeCost: 2,
                outputLen: 32,
                parallelism: 1
        });
}

export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
        return await verify(hash, password);
}

/**
 * Validasi kekuatan password:
 *  - Panjang 8-255 karakter (wajib).
 *  - Cek password bocor via HaveIBeenPwned API (k- anonymity, hanya kirim 5 char pertama SHA-1).
 *
 * DEFENSIF: kalau layanan HIBP unreachable (network error, rate-limit, offline,
 * blokir di Vercel/network policy), function tetap return true asalkan panjang
 * valid. Tujuan: tidak memblokir user mengubah password hanya karena API eksternal
 * sedang tidak bisa diakses.
 */
export async function verifyPasswordStrength(password: string): Promise<boolean> {
        if (password.length < 8 || password.length > 255) {
                return false;
        }
        try {
                const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
                const hashPrefix = hash.slice(0, 5);
                const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
                        signal: AbortSignal.timeout(4000),
                });
                if (!response.ok) {
                        // HIBP returns non-200 -> skip check, anggap cukup kuat (panjang OK).
                        return true;
                }
                const data = await response.text();
                const items = data.split("\n");
                for (const item of items) {
                        const hashSuffix = item.slice(0, 35).toLowerCase();
                        if (hash === hashPrefix + hashSuffix) {
                                return false;
                        }
                }
                return true;
        } catch {
                // Network error / timeout / blocked -> jangan gagalkan update password.
                // Panjang sudah valid (>= 8); biarkan user lanjut.
                return true;
        }
}