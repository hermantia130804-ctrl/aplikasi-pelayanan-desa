"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

export async function suratPengantarRTAction(operation: string, payload?: unknown) {
  try {
    await getSession();

    // ===== LIST (port: GET /api/surat-pengantar) =====
    if (operation === "list") {
      const data = await prisma.suratPengantar.findMany({
        orderBy: { createdAt: "desc" },
      });
      return { status: 200, data };
    }

    // ===== CREATE (port: POST /api/surat-pengantar) =====
    if (operation === "create") {
      const { rtId, nomorSurat, namaPemohon, nik, tujuan, keterangan, ketuaRW } =
        (payload ?? {}) as Record<string, string | number | undefined>;

      if (!nomorSurat || !namaPemohon || !nik || !tujuan) {
        throw new ApiError(status.BAD_REQUEST, "Nomor surat, nama pemohon, NIK, dan tujuan wajib diisi");
      }

      const surat = await prisma.suratPengantar.create({
        data: {
          rtId: typeof rtId === "number" ? rtId : 1,
          nomorSurat: String(nomorSurat).trim().toUpperCase(),
          namaPemohon: String(namaPemohon).trim().toUpperCase(),
          nik: String(nik).trim(),
          tujuan: String(tujuan).trim().toUpperCase(),
          keterangan: keterangan ? String(keterangan).trim().toUpperCase() : null,
          ketuaRW: ketuaRW ? String(ketuaRW).trim().toUpperCase() : null,
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, data: surat };
    }

    // ===== UPDATE (port: PUT /api/surat-pengantar) =====
    if (operation === "update") {
      const { id, nomorSurat, namaPemohon, nik, tujuan, keterangan, ketuaRW } =
        (payload ?? {}) as Record<string, string | number | undefined>;

      if (!id) throw new ApiError(status.BAD_REQUEST, "ID surat wajib");

      const surat = await prisma.suratPengantar.update({
        where: { id: Number(id) },
        data: {
          ...(nomorSurat ? { nomorSurat: String(nomorSurat).trim().toUpperCase() } : {}),
          ...(namaPemohon ? { namaPemohon: String(namaPemohon).trim().toUpperCase() } : {}),
          ...(nik ? { nik: String(nik).trim() } : {}),
          ...(tujuan ? { tujuan: String(tujuan).trim().toUpperCase() } : {}),
          ...(keterangan !== undefined
            ? { keterangan: keterangan ? String(keterangan).trim().toUpperCase() : null }
            : {}),
          ...(ketuaRW !== undefined
            ? { ketuaRW: ketuaRW ? String(ketuaRW).trim().toUpperCase() : null }
            : {}),
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, data: surat };
    }

    // ===== DELETE (port: DELETE /api/surat-pengantar?id=) =====
    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: number };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID surat wajib");
      await prisma.suratPengantar.delete({ where: { id: Number(id) } });
      revalidatePath("/data-warga");
      return { status: 200, message: "Surat pengantar berhasil dihapus" };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (suratPengantarRT):", error);
    return { status: 500, error: "Gagal memproses surat pengantar" };
  }
}
