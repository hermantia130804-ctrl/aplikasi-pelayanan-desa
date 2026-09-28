"use server";

import { z } from "zod";
import { MESSAGE } from "@/constants/message";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
  createPermohonanKKService,
  deletePermohonanKKService,
  findPermohonanKKByIdService,
  updateStatusPermohonanKKService,
  updatePermohonanKKService,
  followUpPermohonanKKService,
} from "../services/permohonan-kk";
import { findCurrentSessionService } from "../services/session";
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";

const requireStaff = async () => {
  const session = await findCurrentSessionService();
  if (!session?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
  if (session.user.role !== "ADMIN" && session.user.role !== "PETUGAS") {
    throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat melakukan aksi ini");
  }
  return session;
};

const requireFullAdmin = async () => {
  const session = await findCurrentSessionService();
  if (!session?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
  if (session.user.role !== "ADMIN") {
    throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
  }
  return session;
};

export const createPermohonanKKMandiriAction = async (payload: unknown) => {
  try {
    const session = await requireStaff();
    const nomorPermohonan = await generateNomorPermohonan("KK");
    const data = await createPermohonanKKService(session.user.userId, {
      ...(payload as Record<string, unknown>),
      nomorPermohonan,
    });

    await notifikasiPetugasBaru("KK", {
      nama: (payload as { nama?: string }).nama,
      alasan: (payload as { alasanPermohonan?: string }).alasanPermohonan,
      pengaju: "via aplikasi",
    });

    revalidatePath("/permohonan-kk");
    return { status: status.OK, message: "Permohonan KK berhasil dikirim", data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updateStatusPermohonanKKAction = async (id: string, newStatus: "DIAJUKAN" | "DISETUJUI" | "DITOLAK", catatan?: string) => {
  try {
    await requireStaff();
    await updateStatusPermohonanKKService(id, { statusPermohonan: newStatus, catatan });
    revalidatePath("/permohonan-kk");
    return { status: status.OK, message: "Status permohonan KK berhasil diperbarui" };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updatePermohonanKKAction = async (id: string, payload: unknown) => {
  try {
    await requireFullAdmin();
    const data = await updatePermohonanKKService(id, payload as Record<string, unknown>);
    revalidatePath("/permohonan-kk");
    return { status: status.OK, message: "Permohonan KK berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deletePermohonanKKAction = async (id: string) => {
  try {
    await requireFullAdmin();
    await deletePermohonanKKService(id);
    revalidatePath("/permohonan-kk");
    return { status: status.OK, message: "Permohonan KK berhasil dihapus" };
  } catch (error) {
    return errorHandler(error);
  }
};

export const findPermohonanKKByIdAction = async (id: string) => {
  try {
    const data = await findPermohonanKKByIdService(id);
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

const followUpPermohonanKKSchema = z.object({
  permohonanKKId: z.string().min(1),
  statusPermohonan: z.enum(["DIAJUKAN", "DISETUJUI", "DITOLAK"]),
  nomorPermohonan: z.string().optional(),
  catatan: z.string().optional(),
});

export const followUpPermohonanKKActionV2 = async (payload: unknown) => {
  try {
    await requireStaff();
    const parsed = followUpPermohonanKKSchema.parse(payload);
    const { permohonanKKId, ...data } = parsed;
    await followUpPermohonanKKService(permohonanKKId, data);
    revalidatePath("/permohonan-kk");
    revalidatePath("/permohonan-kk/" + permohonanKKId);
    return { status: status.OK, message: "Tindak lanjut permohonan KK berhasil disimpan" };
  } catch (error) {
    return errorHandler(error);
  }
};
