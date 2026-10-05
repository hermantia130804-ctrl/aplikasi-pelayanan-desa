import { NextRequest, NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Penyaji dokumen privat permohonan KK (KTP/Akta/Pengantar).
 * Akses: ADMIN/PETUGAS (semua) atau pemilik permohonan.
 * Pemakaian: /api/berkas-kk?id=<permohonanKKId>&jenis=<dokumenKTP|dokumenAkta|dokumenPengantar>
 */
const KOLOM = {
  dokumenKTP: "dokumen_ktp",
  dokumenAkta: "dokumen_akta",
  dokumenPengantar: "dokumen_pengantar",
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    const jenisRaw = req.nextUrl.searchParams.get("jenis") ?? "";
    const jenis = jenisRaw as keyof typeof KOLOM;
    const kolom = KOLOM[jenis];
    if (!id || !kolom) return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });

    const data = await prisma.permohonanKK.findUnique({ where: { permohonanKKId: id } });
    if (!data) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff && data.userId !== session.user.userId) {
      return NextResponse.json({ error: "Tidak berhak" }, { status: 403 });
    }

    const url = data[kolom] as unknown as string | null;
    if (!url) return NextResponse.json({ error: "Dokumen tidak ada" }, { status: 404 });

    const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
    if (!token) return NextResponse.json({ error: "Konfigurasi storage belum ada" }, { status: 500 });

    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Gagal memuat berkas" }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("ERROR ASLI (berkas-kk):", error);
    return NextResponse.json({ error: "Kesalahan server" }, { status: 500 });
  }
}
