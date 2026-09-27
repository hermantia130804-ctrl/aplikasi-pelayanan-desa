import { NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { kirimWa } from "@/lib/server/services/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await findCurrentSessionService();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const target = process.env.ADMIN_WA ?? "6285772646402";
  const token = process.env.FONNTE_TOKEN ?? "";
  const domain = process.env.FONNTE_DOMAIN ?? "api.fonnte.com";

  const hasil: Record<string, unknown> = {
    domain,
    tokenAda: !!token,
    target,
  };

  try {
    const res = await fetch(`https://${domain}/send`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target,
        message: "🔔 Tes WA dari aplikasi desa — jalur API OK!",
      }),
    });
    const json = await res.json().catch(() => null);
    hasil.httpStatus = res.status;
    hasil.responsFonnte = json;
    hasil.sukses = json?.status === true || json?.detail === "success! message in queue";
  } catch (e) {
    hasil.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(hasil);
}