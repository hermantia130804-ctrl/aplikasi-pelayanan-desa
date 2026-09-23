"use server";

import { deletePermohonanWithFiles } from "../services/permohonan-delete";

import { MESSAGE } from "@/constants/message";
import { status } from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
  createPermohonanKKService,
  deletePermohonanKKService,
  findPermohonanKKByIdService,
  updateStatusPermohonanKKService,
} from "../services/permohonan-kk";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";
import { generateNomorPermohonan } from "../services/nomor-permohonan";

export const createPermohonanKKMandiriAction = async (payload: unknown) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const nomorPermohonan = await generateNomorPermohonan("KK");
    const data = await createPermohonanKKService(currentSession.user.userId, { ...(payload as object), nomorPermohonan });
    revalidatePath("/permohonan-kk");

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      const p = payload as { nama?: string; nik?: string; alasanPermohonan?: string };
      if (adminEmail) {
        await sendEmail(adminEmail, "Permohonan KK Baru Masuk",
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
             <h2>📬 Permohonan KK Baru</h2>
             <ul><li><b>No. Permohonan:</b> ${nomorPermohonan}</li><li><b>Nama:</b> ${p.nama ?? "-"}</li><li><b>NIK:</b> ${p.nik ?? "-"}</li><li><b>Alasan:</b> ${p.alasanPermohonan ?? "-"}</li></ul>
             <p>Silakan proses melalui menu <b>Kelola Permohonan KK</b>.</p></div>`);
      }
    } catch (mailError) {
      console.error("GAGAL KIRIM EMAIL NOTIFIKASI KK:", mailError);
    }

    return { status: status.OK, message: "Permohonan KK berhasil dikirim", data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updateStatusPermohonanKKAction = async (id: string, newStatus: "DIAJUKAN" | "DISETUJUI" | "DITOLAK", catatan?: string) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat mengubah status permohonan");
    await updateStatusPermohonanKKService(id, { statusPermohonan: newStatus, catatan });
    revalidatePath("/permohonan-kk");
    return { status: status.OK, message: "Status permohonan KK berhasil diperbarui" };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deletePermohonanKKAction = async (id: string) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat menghapus permohonan");
    await deletePermohonanWithFiles("KK", id);
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

export const updatePermohonanKKAction = async (id: string, payload: unknown) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat mengubah permohonan");
    const data = await updatePermohonanKKService(id, payload as Record<string, unknown>);
    revalidatePath("/permohonan-kk");
    return { status: status.OK, message: "Permohonan KK berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};
