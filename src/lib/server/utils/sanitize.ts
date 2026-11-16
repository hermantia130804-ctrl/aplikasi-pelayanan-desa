/**
 * Escape karakter HTML untuk mencegah HTML/XSS injection saat menyisipkan
 * data user-controlled (nama, catatan, alasan, dll) ke template email HTML.
 *
 * Issue #8: sebelumnya field seperti data.user.name, data.catatan,
 * d.alasan, d.pengaju disisipkan langsung ke string HTML email tanpa
 * escaping. Attacker yang mengontrol field tersebut (mis. set nama =
 * '<img src=x onerror=fetch(...)>') bisa inject tracking pixel / phishing
 * link ke email yang diterima petugas/warga.
 */
export function escapeHtml(value: string | null | undefined): string {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
