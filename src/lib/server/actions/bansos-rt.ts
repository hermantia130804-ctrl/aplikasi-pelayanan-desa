"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { BANTUAN_OPTIONS, BPJS_OPTIONS, DESIL_OPTIONS } from "@/constants/data-warga";

export async function updateBansosAction(payload: unknown) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
    if (session.user.role !== "ADMIN" && session.user.role !== "PETUGAS" && session.user.role !== "RT") {
      throw new ApiError(status.FORBIDDEN, "Hanya admin, petugas, atau Ketua RT yang dapat mengubah.");
    }

    const d = (payload ?? {}) as { id?: string; bantuan?: string[]; bpjs?: string; desil?: string };
    if (!d.id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");

    const warga = await prisma.dataWarga.findUnique({ where: { dataWargaId: String(d.id) } });
    if (!warga) throw new ApiError(status.NOT_FOUND, "Data warga tidak ditemukan.");
    if (!isStaff(session.user.role) && warga.userId !== session.user.userId) {
      throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
    }

    const u: Record<string, unknown> = {};
    if (d.bantuan !== undefined) {
      const arr = Array.isArray(d.bantuan) ? d.bantuan : [];
      const valid = arr.filter(b => (BANTUAN_OPTIONS as readonly string[]).includes(b));
      u.bantuan = valid;
    }
    if (d.bpjs !== undefined) {
      u.bpjs = (BPJS_OPTIONS as readonly string[]).includes(String(d.bpjs)) ? String(d.bpjs) : null;
    }
    if (d.desil !== undefined) {
      u.desil = (DESIL_OPTIONS as readonly string[]).includes(String(d.desil)) ? String(d.desil) : null;
    }

    const data = await prisma.dataWarga.update({ where: { dataWargaId: String(d.id) }, data: u });
    revalidatePath("/data-warga");
    return { status: 200, message: "Status bantuan berhasil diperbarui", data };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (bansos):", error);
    return { status: 500, error: "Terjadi kesalahan pada server." };
  }
}

function isStaff(role: string) {
  return role === "ADMIN" || role === "PETUGAS";
}
