import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "@/lib/server/services/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await findCurrentSessionService();
  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  try {
    const target = await prisma.permohonanKK.findFirst({ orderBy: { createdAt: "desc" } });
    if (!target) {
      return NextResponse.json({ error: "Belum ada data permohonan KK untuk dites" });
    }

    const sebelum = target.statusPermohonan;
    const sesudah = sebelum === "DISETUJUI" ? "DIAJUKAN" : "DISETUJUI";

    const updated = await prisma.permohonanKK.update({
      where: { permohonanKKId: target.permohonanKKId },
      data: { statusPermohonan: sesudah },
    });

    return NextResponse.json({
      success: true,
      idDites: target.permohonanKKId,
      statusAwal: sebelum,
      statusAkhir: updated.statusPermohonan,
      kesimpulan: "Update prisma BERHASIL → database & koneksi OK. Berarti masalah ada di payload dari modal.",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string })?.code,
    }, { status: 500 });
  }
}
