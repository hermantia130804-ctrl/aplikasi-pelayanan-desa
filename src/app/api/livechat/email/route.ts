import { NextRequest, NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { sendEmail } from "@/lib/server/utils/email";

export const dynamic = "force-dynamic";

type ChatMsg = { role: "user" | "assistant"; content: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWaktuId(date: Date): string {
  try {
    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return date.toLocaleString("id-ID");
  }
}

/**
 * POST /api/livechat/email
 * Body: { messages: ChatMsg[], email?: string, name?: string }
 * Balasan: { ok: true, sentTo: string }
 *
 * Mengirim riwayat percakapan livechat ke email.
 * - Jika pengguna login: kirim ke email sesi (body.email diabaikan).
 * - Jika tamu (belum login): wajib menyertakan body.email yang valid.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const session = await findCurrentSessionService();

    const body = await req.json().catch(() => ({}));
    const rawMessages: unknown = body?.messages;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: "Riwayat percakapan kosong." }, { status: 400 });
    }

    const messages: ChatMsg[] = rawMessages
      .filter(
        (m): m is ChatMsg =>
          !!m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      );

    if (messages.length === 0) {
      return NextResponse.json({ error: "Riwayat percakapan kosong." }, { status: 400 });
    }

    // Email tujuan + nama: prioritas email yang dikumpulkan widget di onboarding
    // (body.email + body.name); fallback ke sesi login bila body.email tidak ada.
    // Widget onboarding selalu mengirim email yang sudah divalidasi (format + domain).
    let email: string;
    let nama: string;
    const rawEmail: unknown = body?.email;
    if (typeof rawEmail === "string" && EMAIL_RE.test(rawEmail.trim())) {
      email = rawEmail.trim();
      nama = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "Warga";
    } else if (session?.user?.email) {
      email = session.user.email;
      nama = session.user.name || "Warga";
    } else {
      return NextResponse.json({ error: "Email penerima tidak valid. Silakan masukkan email aktif Anda." }, { status: 400 });
    }

    const rows = messages
      .map(
        (m) => `
        <tr>
          <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;width:110px;vertical-align:top;background:#f9fafb;">
            ${m.role === "user" ? "Anda" : "Asisten AI"}
          </td>
          <td style="padding:10px;border:1px solid #e5e7eb;white-space:pre-wrap;line-height:1.5;">
            ${escapeHtml(m.content)}
          </td>
        </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#1f2937;">
        <h2 style="color:#065f46;margin:0 0 8px;">Riwayat Percakapan Livechat</h2>
        <p style="margin:0 0 4px;">Halo <strong>${escapeHtml(nama)}</strong>,</p>
        <p style="margin:0 0 16px;color:#6b7280;">
          Berikut riwayat percakapan Anda dengan Asisten Digital Desa Sukamaju pada
          <strong>${formatWaktuId(new Date())}</strong> (WIB).
        </p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
        <p style="margin-top:20px;color:#6b7280;font-size:12px;">
          Email ini dikirim otomatis dari Aplikasi Pelayanan Desa Sukamaju. Jangan balas email ini secara langsung.
        </p>
      </div>`;

    await sendEmail(email, "Riwayat Percakapan Livechat - Desa Sukamaju", html);

    return NextResponse.json({ ok: true, sentTo: email });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengirim email.";
    console.error("[livechat-email] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
