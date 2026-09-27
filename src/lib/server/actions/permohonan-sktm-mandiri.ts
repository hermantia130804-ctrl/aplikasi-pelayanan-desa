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
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";

export const createPermohonanSKTMMandiriAction = async (payload: TCreatePermohonanSKTMSchema) => {
  const message = MESSAGE.SKTM_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const nomorPermohonan = await generateNomorPermohonan("SKTM");
    const data = await createPermohonanSKTMService(currentSession.user.userId, { ...payload, nomorPermohonan });

    await notifikasiPetugasBaru("SKTM", { nama: payload.nama, alasan: "Pengajuan SKTM", pengaju: "via aplikasi" });

    revalidatePath(PATHS.SKTM_REQUEST);
    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};