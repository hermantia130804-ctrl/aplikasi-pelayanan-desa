"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { createPermohonanSKDSchema } from "@/lib/validators/permohonan-skd";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { createPermohonanSKDService } from "../services/permohonan-skd";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";

export async function createPermohonanSKDMandiriAction(formData: FormData) {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.GLOBAL.UNAUTHORIZED);

    const rawData = Object.fromEntries(formData.entries());
    const parsedData = {
      ...rawData,
      tanggalLahir: new Date(rawData.tanggalLahir as string),
      expiresAt: new Date(rawData.expiresAt as string),
    };

    const validatedData = createPermohonanSKDSchema.parse(parsedData);
    const data = await createPermohonanSKDService(currentSession.user.userId, validatedData);
    revalidatePath(PATHS.SKD_REQUEST);

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        await sendEmail(adminEmail, "Permohonan SKD Baru Masuk",
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
             <h2>📬 Permohonan SKD Baru</h2>
             <ul><li><b>Nama:</b> ${validatedData.nama}</li><li><b>NIK:</b> ${validatedData.nik}</li><li><b>Alamat Domisili:</b> ${validatedData.alamatDomisili}</li></ul>
             <p>Silakan proses melalui menu <b>Kelola Permohonan SKD</b>.</p></div>`);
      }
    } catch (mailError) {
      console.error("GAGAL KIRIM EMAIL NOTIFIKASI SKD:", mailError);
    }

    return { success: true, message: MESSAGE.PERMOHONAN_SKD.CREATE_OK, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.PERMOHONAN_SKD.CREATE_FAIL);
  }
}
