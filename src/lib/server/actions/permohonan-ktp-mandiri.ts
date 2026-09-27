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
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";

export const createPermohonanKTPMandiriAction = async (payload: TCreatePermohonanKTPSchema) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const nomorPermohonan = await generateNomorPermohonan("KTP");
    const data = await createPermohonanKTPService(currentSession.user.userId, { ...payload, nomorPermohonan });

    await notifikasiPetugasBaru("KTP", { nama: payload.nama ?? payload.name, alasan: "Pengajuan KTP", pengaju: "via aplikasi" });

    revalidatePath(PATHS.KTP_REQUEST);
    return { status: status.OK, message: MESSAGE.KTP_REQUEST?.CREATE_OK || "Permohonan KTP berhasil dikirim", data };
  } catch (error) {
    return errorHandler(error);
  }
};