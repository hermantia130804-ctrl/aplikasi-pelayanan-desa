"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKLSchema } from "@/lib/validators/permohonan-skl";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { createPermohonanSKLService } from "../services/permohonan-skl";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";
import { generateNomorPermohonan } from "../services/nomor-permohonan";

export const createPermohonanSKLMandiriAction = async (payload: TCreatePermohonanSKLSchema) => {
  const message = MESSAGE.SKL_REQUEST || MESSAGE.GLOBAL;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const nomorPermohonan = await generateNomorPermohonan("SKL");
    const data = await createPermohonanSKLService(currentSession.user.userId, { ...payload, nomorPermohonan });
    revalidatePath(PATHS.SKL_REQUEST || "/permohonan-skl");

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        await sendEmail(adminEmail, "Permohonan SKL Baru Masuk",
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
             <h2>📬 Permohonan SKL Baru</h2>
             <ul><li><b>Nama (anak):</b> ${payload.nama}</li><li><b>Alamat:</b> ${payload.alamat}</li></ul>
             <p>Silakan proses melalui menu <b>Kelola Permohonan SKL</b>.</p></div>`);
      }
    } catch (mailError) {
      console.error("GAGAL KIRIM EMAIL NOTIFIKASI SKL:", mailError);
    }

    return { status: status.OK, message: message.CREATE_OK || "Permohonan SKL berhasil dibuat", data };
  } catch (error) {
    return errorHandler(error);
  }
};
