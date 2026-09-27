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
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";

export const createPermohonanSKLMandiriAction = async (payload: TCreatePermohonanSKLSchema) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const nomorPermohonan = await generateNomorPermohonan("SKL");
    const data = await createPermohonanSKLService(currentSession.user.userId, { ...payload, nomorPermohonan });

    await notifikasiPetugasBaru("SKL", { nama: payload.nama, alasan: "Pengajuan SKL", pengaju: "via aplikasi" });

    revalidatePath(PATHS.SKL_REQUEST || "/permohonan-skl");
    return { status: status.OK, message: message.CREATE_OK || "Permohonan SKL berhasil dibuat", data };
  } catch (error) {
    return errorHandler(error);
  }
};