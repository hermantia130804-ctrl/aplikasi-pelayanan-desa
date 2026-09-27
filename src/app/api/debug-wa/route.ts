import { NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await findCurrentSessionService();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const token = process.env.FONNTE_TOKEN ?? "";
  const target = "6285772646402";
  const pesan = "🔬 Debug variasi format Fonnte";

  const variasi: Record<string, { url: string; headers: Record<string, string>; body: string }> = {
    "1-json-auth": {
      url: "https://md.fonnte.com/send",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ target, message: pesan }),
    },
    "2-json-bearer": {
      url: "https://md.fonnte.com/send",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ target, message: pesan }),
    },
    "3-form-urlencoded": {
      url: "https://md.fonnte.com/send",
      headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ target, message: pesan }).toString(),
    },
    "4-wildcard-domain": {
      url: "https://api.fonnte.com/send",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ target, message: pesan }),
    },
  };

  const hasil: Record<string, unknown> = {};
  for (const [nama, v] of Object.entries(variasi)) {
    try {
      const res = await fetch(v.url, { method: "POST", headers: v.headers, body: v.body });
      const json = await res.json().catch(() => null);
      hasil[nama] = { httpStatus: res.status, respons: json };
    } catch (e) {
      hasil[nama] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ tokenPanjang: token.length, hasil });
}