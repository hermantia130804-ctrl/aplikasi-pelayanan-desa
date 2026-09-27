import { NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { kirimWa } from "@/lib/server/services/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await findCurrentSessionService();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const token = process.env.FONNTE_TOKEN ?? "";
  const target = process.env.ADMIN_WA ?? "";

  // Kirim WA langsung dari endpoint ini (bukan lewat service) — untuk isolasi
  let hasilKirim: unknown = null;
  let errorKirim: string | null = null;
  try {
    const res = await fetch(`https://md.fonnte.com/send`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: "6285772646402",
        message: "🔬 Debug langsung dari endpoint — tes jalur Fonnte",
      }),
    });
    const json = await res.json().catch(() => ({}));
    hasilKirim = { status: res.status, respons: json };
  } catch (e) {
    errorKirim = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    tokenAda: !!token,
    awalanToken: token.slice(0, 20),
    panjangToken: token.length,
    domain: process.env.FONNTE_DOMAIN ?? "md.fonnte.com",
    adminWa: process.env.ADMIN_WA ?? "belum diisi",
    hasilKirimLangsung: hasilKirim,
    errorKirimLangsung: errorKirim,
  });
}