import { NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await findCurrentSessionService();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  return NextResponse.json({
    adaTokenPublic: !!process.env.BLOB_PUBLIC_READ_WRITE_TOKEN,
    awalanTokenPublic: process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.slice(0, 25) ?? null,
    adaTokenDokumen: !!process.env.BLOB_READ_WRITE_TOKEN,
    awalanTokenDokumen: process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 25) ?? null,
  });
}
