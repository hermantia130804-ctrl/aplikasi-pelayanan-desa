"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanKTPSchema } from "@/lib/validators/permohonan-ktp";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { createPermohonanKTPService } from "../services/permohonan-ktp";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";

export const createPermohonanKTPMandiriAction = async (payload: TCreatePermohonanKTPSchema) => {
  const message = MESSAGE.KTP_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const data = await createPermohonanKTPService(currentSession.user.userId, payload);
    revalidatePath(PATHS.KTP_REQUEST);

    // Notifikasi email ke admin (kegagalan kirim TIDAK menggagalkan permohonan)
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail) {
        await sendEmail(
          adminEmail,
          "Permohonan KTP Baru Masuk",
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
             <h2>📬 Permohonan KTP Baru</h2>
             <p>Ada permohonan KTP baru dari warga:</p>
             <ul>
               <li><b>Nama:</b> ${payload.nama}</li>
               <li><b>NIK:</b> ${payload.nik}</li>
               <li><b>Jenis:</b> ${payload.jenisPermohonanKTP ?? "BARU"}</li>
               <li><b>Alamat:</b> ${payload.alamat}</li>
             </ul>
             <p>Silakan proses melalui menu <b>Kelola Permohonan KTP</b> di dashboard admin.</p>
           </div>`
        );
      }
    } catch (mailError) {
      console.error("GAGAL KIRIM EMAIL NOTIFIKASI:", mailError);
    }

    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};
