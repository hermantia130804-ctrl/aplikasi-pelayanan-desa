import { NextRequest, NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { getLivechatUserContext, generateLivechatReply, ChatMessage } from "@/lib/server/services/livechat-ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/livechat
 * Body: { message: string, history?: ChatMessage[] }
 * Balasan: { reply: string }
 *
 * Server stateless — riwayat percakapan dikirim klien (tidak disimpan server-side).
 * Sesi opsional: jika login, konteks user (NIK + detailBansos) diambil dari sesi
 * (untuk personalisasi "cek bansos saya"); jika tamu belum login, jawaban bersifat
 * umum (pejabat/layanan/alamat) dan bila ditanya bansos pribadi user disuruh login.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await findCurrentSessionService();

    const body = await req.json().catch(() => ({}));
    const message: unknown = body?.message;
    const rawHistory: unknown = body?.history;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Pesan tidak valid." }, { status: 400 });
    }

    const history: ChatMessage[] = Array.isArray(rawHistory)
      ? rawHistory
          .filter(
            (m): m is ChatMessage =>
              !!m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-10)
      : [];

    const userCtx = session?.user
      ? await getLivechatUserContext(session.user.userId)
      : null;

    const reply = await generateLivechatReply(userCtx, history, message.trim());
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memproses pesan.";
    console.error("[livechat] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
