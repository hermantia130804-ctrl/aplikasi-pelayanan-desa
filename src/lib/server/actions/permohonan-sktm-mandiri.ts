"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKTMSchema } from "@/lib/validators/permohonan-sktm";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { createPermohonanSKTMService } from "../services/permohonan-sktm";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";

export const createPermohonanSKTMMandiriAction = async (payload: TCreatePermohonanSKTMSchema) => {
  const message = MESSAGE.SKTM_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const data = await createPermohonanSKTMService(currentSession.user.userId, payload);
    revalidatePath(PATHS.SKTM_REQUEST);

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        await sendEmail(adminEmail, "Permohonan SKTM Baru Masuk",
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
             <h2>📬 Permohonan SKTM Baru</h2>
             <ul><li><b>Nama:</b> ${payload.nama}</li><li><b>NIK:</b> ${payload.nik}</li><li><b>Alamat:</b> ${payload.alamat}</li></ul>
             <p>Silakan proses melalui menu <b>Kelola Permohonan SKTM</b>.</p></div>`);
      }
    } catch (mailError) {
      console.error("GAGAL KIRIM EMAIL NOTIFIKASI SKTM:", mailError);
    }

    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};
