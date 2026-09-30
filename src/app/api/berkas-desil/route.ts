import { NextRequest, NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Penyaji foto privat perbaikan desil.
 * Akses: ADMIN/PETUGAS (semua) atau pemilik pengajuan (miliknya saja).
 * Pemakaian: /api/berkas-desil?id=<perbaikanDesilId>&i=<index foto>
 */
export async function GET(req: NextRequest) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    const i = parseInt(req.nextUrl.searchParams.get("i") ?? "0", 10);
    if (!id || Number.isNaN(i) || i < 0) {
      return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
    }

    const data = await prisma.perbaikanDesil.findUnique({ where: { perbaikanDesilId: id } });
    if (!data) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff && data.userId !== session.user.userId) {
      return NextResponse.json({ error: "Tidak berhak" }, { status: 403 });
    }

    const urls = (data.fotoUrls as unknown as string[]) ?? [];
    const target = urls[i];
    if (!target) return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });

    const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
    if (!token) return NextResponse.json({ error: "Konfigurasi storage belum ada" }, { status: 500 });

    const upstream = await fetch(target, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Gagal memuat berkas" }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("ERROR ASLI (berkas-desil):", error);
    return NextResponse.json({ error: "Kesalahan server" }, { status: 500 });
  }
}
