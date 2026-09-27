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
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";

export const createPermohonanSKUMandiriAction = async (payload: TCreatePermohonanSKUSchema) => {
  const message = MESSAGE.PERMOHONAN_SKU;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const nomorPermohonan = await generateNomorPermohonan("SKU");
    const data = await createPermohonanSKUService(currentSession.user.userId, { ...payload, nomorPermohonan });

    await notifikasiPetugasBaru("SKU", { nama: payload.nama, alasan: "Pengajuan SKU", pengaju: "via aplikasi" });

    revalidatePath(PATHS.SKU_REQUEST);
    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};