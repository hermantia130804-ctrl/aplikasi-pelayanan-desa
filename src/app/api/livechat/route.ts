import { NextRequest, NextResponse } from "next/server";
import {
  getBansosByNik,
  generateLivechatReply,
  ChatMessage,
  LivechatUserContext,
} from "@/lib/server/services/livechat-ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/livechat
 * Body: { message: string, history?: ChatMessage[], nama?: string, nik?: string, email?: string }
 * Balasan: { reply: string }
 *
 * Flow onboarding widget mengumpulkan nama, NIK (16 digit), dan email sebelum
 * chat dimulai. Server stateless — riwayat dikirim klien. NIK dari body dipakai
 * untuk mencari data bansos di database (lookup by NIK) agar AI bisa menjawab
 * pertanyaan "cek bansos saya" secara faktual. Email tidak dipakai di endpoint
 * ini (hanya nama + NIK untuk konteks); email dipakai endpoint /email saat
 * kirim riwayat.
 */
export async function POST(req: NextRequest) {
  try {
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

    const nama: string =
      typeof body?.nama === "string" && body.nama.trim() ? body.nama.trim() : "Warga";
    const nik: string =
      typeof body?.nik === "string" ? body.nik.trim() : "";

    // Lookup data bansos berdasarkan NIK dari onboarding.
    const detailBansos = nik ? await getBansosByNik(nik) : null;

    const userCtx: LivechatUserContext = { name: nama, nik, detailBansos };

    const reply = await generateLivechatReply(userCtx, history, message.trim());
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memproses pesan.";
    console.error("[livechat] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
