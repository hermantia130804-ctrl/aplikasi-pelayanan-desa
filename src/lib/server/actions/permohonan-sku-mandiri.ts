"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKUSchema } from "@/lib/validators/permohonan-sku";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { createPermohonanSKUService } from "../services/permohonan-sku";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";

export const createPermohonanSKUMandiriAction = async (payload: TCreatePermohonanSKUSchema) => {
  const message = MESSAGE.PERMOHONAN_SKU;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const data = await createPermohonanSKUService(currentSession.user.userId, payload);
    revalidatePath(PATHS.SKU_REQUEST);

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        await sendEmail(adminEmail, "Permohonan SKU Baru Masuk",
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
             <h2>📬 Permohonan SKU Baru</h2>
             <ul><li><b>Nama:</b> ${payload.nama}</li><li><b>NIK:</b> ${payload.nik}</li><li><b>Jenis Usaha:</b> ${payload.jenisUsaha}</li></ul>
             <p>Silakan proses melalui menu <b>Kelola Permohonan SKU</b>.</p></div>`);
      }
    } catch (mailError) {
      console.error("GAGAL KIRIM EMAIL NOTIFIKASI SKU:", mailError);
    }

    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};
