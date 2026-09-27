import { NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { kirimWa } from "@/lib/server/services/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await findCurrentSessionService();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const target = process.env.ADMIN_EMAIL ?? "";
  if (!target) return NextResponse.json({ error: "ADMIN_EMAIL kosong" }, { status: 400 });

  const ok = await kirimWa(target, "🔔 Tes WA dari aplikasi desa — jalur Fonnte OK!");
  return NextResponse.json({
    success: ok,
    dikirimKe: target,
    tokenAda: !!process.env.FONNTE_TOKEN,
    domain: process.env.FONNTE_DOMAIN ?? "md.fonnte.com",
  });
}
