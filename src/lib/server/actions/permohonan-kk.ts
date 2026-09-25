"use server";

import { MESSAGE } from "@/constants/message";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
  createPermohonanKKService,
  deletePermohonanKKService,
  findPermohonanKKByIdService,
  updatePermohonanKKService,
  updateStatusPermohonanKKService,
  followUpPermohonanKKService,
} from "../services/permohonan-kk";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { prisma } from "@/lib/prisma";

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
    if (currentSession.user.role !== "ADMIN" && currentSession.user.role !== "PETUGAS") throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat mengubah status permohonan");
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

export const followUpPermohonanKKActionV2 = async (payload: {
  permohonanKKId: string;
  statusPermohonan: string;
  nomorPermohonan?: string;
  catatan?: string;
}) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN" && currentSession.user.role !== "PETUGAS") throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat melakukan tindak lanjut");

    const validStatus = ["DIAJUKAN", "DISETUJUI", "DITOLAK"] as const;
    if (!validStatus.includes(payload.statusPermohonan as any)) {
      throw new ApiError(status.BAD_REQUEST, "Status permohonan tidak valid");
    }

    const dataUpdate: Record<string, unknown> = {
      statusPermohonan: payload.statusPermohonan,
      updatedAt: new Date(),
    };
    if (payload.nomorPermohonan && payload.nomorPermohonan.trim() !== "") {
      dataUpdate.nomorPermohonan = payload.nomorPermohonan.trim();
    }
    if (payload.catatan !== undefined) {
      dataUpdate.catatan = payload.catatan;
    }

    await prisma.permohonanKK.update({
      where: { permohonanKKId: payload.permohonanKKId },
      data: dataUpdate,
    });

    // Kirim email update status ke warga
    try {
      await kirimEmailStatusWargaKK(payload.permohonanKKId);
    } catch (e) {
      console.error("GAGAL EMAIL STATUS WARGA:", e);
    }

    // Kirim email update status ke warga
    try {
      await kirimEmailStatusWargaKK(payload.permohonanKKId);
    } catch (e) {
      console.error("GAGAL EMAIL STATUS WARGA:", e);
    }
    revalidatePath("/permohonan-kk");
    return { status: status.OK, message: "Tindak lanjut permohonan KK berhasil disimpan" };
  } catch (error) {
    return errorHandler(error);
  }
};

export const kirimEmailStatusWargaKK = async (permohonanKKId: string) => {
  try {
    const data = await findPermohonanKKByIdService(permohonanKKId);
    if (!data?.user?.email) return;

    const statusMap: Record<string, string> = {
      DIAJUKAN: "Menunggu Proses",
      DISETUJUI: "✅ DISETUJUI",
      DITOLAK: "❌ DITOLAK",
    };
    const statusText = statusMap[data.statusPermohonan] ?? data.statusPermohonan;

    await sendEmail(
      data.user.email,
      `Update Status Permohonan KK - ${data.nomorPermohonan ?? ""}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
         <h2>📬 Update Status Permohonan KK</h2>
         <p>Kepada <b>${data.user.name}</b>,</p>
         <p>Permohonan KK Anda dengan nomor <b>${data.nomorPermohonan ?? "-"}</b> telah diperbarui menjadi:</p>
         <p style="font-size:18px;"><b>Status: ${statusText}</b></p>
         ${data.catatan ? `<p><b>Catatan petugas:</b> ${data.catatan}</p>` : ""}
         <p>Silakan login ke aplikasi untuk melihat detail, atau hubungi kantor desa untuk informasi lebih lanjut.</p>
         <p style="color:#888;font-size:12px;">Aplikasi Pelayanan Desa Sukamaju</p>
       </div>`
    );
    console.log(`[EMAIL] Status KK terkirim ke warga: ${data.user.email}`);
  } catch (e) {
    console.error("GAGAL KIRIM EMAIL STATUS WARGA KK:", e);
  }
};
