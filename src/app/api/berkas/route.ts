import { NextRequest, NextResponse } from "next/server";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Penyaji dokumen privat (generik).
 * Pemakaian: /api/berkas?jenis=kk|ktp&id=<permohonanId>&field=<namaKolomDokumen>
 * Akses: ADMIN/PETUGAS (semua jenis) atau pemilik permohonan.
 */
const KONFIG = {
  kk: { model: "permohonanKK", idField: "permohonanKKId", kolomDiizinkan: ["dokumenKTP", "dokumenAkta", "dokumenPengantar"] },
  ktp: { model: "permohonanKTP", idField: "permohonanKtpId", kolomDiizinkan: ["dokumenKK", "dokumenPengantar"] },
  skl: { model: "permohonanSKL", idField: "permohonanSKLId", kolomDiizinkan: ["dokumenKK", "dokumenPengantar", "dokumenSuratLahir"] },
  sktm: { model: "permohonanSKTM", idField: "permohonanSKTMId", kolomDiizinkan: ["dokumenKK", "dokumenKTP", "dokumenPengantar"] },
  sku: { model: "permohonanSKU", idField: "permohonanSKUId", kolomDiizinkan: ["dokumenKK", "dokumenKTP", "dokumenSP", "dokumenUsaha"] },
  skd: { model: "permohonanSKD", idField: "permohonanSKDId", kolomDiizinkan: ["dokumenKK", "dokumenKTP", "dokumenSP"] },
  pindah: { model: "permohonanPindah", idField: "permohonanPindahId", kolomDiizinkan: ["dokumenKK", "dokumenKTP", "dokumenSP"] },
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

    const jenis = (req.nextUrl.searchParams.get("jenis") ?? "") as keyof typeof KONFIG;
    const id = req.nextUrl.searchParams.get("id");
    const field = req.nextUrl.searchParams.get("field") ?? "";
    const cfg = KONFIG[jenis];
    if (!cfg || !id || !(cfg.kolomDiizinkan as readonly string[]).includes(field)) {
      return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
    }

    const model = prisma[cfg.model] as any;
    const data = await model.findUnique({ where: { [cfg.idField]: id } });
    if (!data) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff && data.userId !== session.user.userId) {
      return NextResponse.json({ error: "Tidak berhak" }, { status: 403 });
    }

    const url = data[field] as unknown as string | null;
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
    console.error("ERROR ASLI (berkas):", error);
    return NextResponse.json({ error: "Kesalahan server" }, { status: 500 });
  }
}
