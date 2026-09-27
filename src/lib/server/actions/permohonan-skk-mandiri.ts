"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKKSchema } from "@/lib/validators/permohonan-skk";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { createPermohonanSKKService } from "../services/permohonan-skk";
import { findCurrentSessionService } from "../services/session";
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";

export const createPermohonanSKKMandiriAction = async (payload: TCreatePermohonanSKKSchema) => {
  const message = MESSAGE.SKK_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const nomorPermohonan = await generateNomorPermohonan("SKK");
    const data = await createPermohonanSKKService(currentSession.user.userId, { ...payload, nomorPermohonan });

    await notifikasiPetugasBaru("SKK", { nama: payload.nama, alasan: "Pengajuan SKK", pengaju: "via aplikasi" });

    revalidatePath(PATHS.SKK_REQUEST);
    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};