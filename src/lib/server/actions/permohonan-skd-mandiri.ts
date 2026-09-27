"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { createPermohonanSKDSchema } from "@/lib/validators/permohonan-skd";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { createPermohonanSKDService } from "../services/permohonan-skd";
import { findCurrentSessionService } from "../services/session";
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";

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
    const nomorPermohonan = await generateNomorPermohonan("SKD");
    const data = await createPermohonanSKDService(currentSession.user.userId, { ...validatedData, nomorPermohonan });

    await notifikasiPetugasBaru("SKD", { nama: validatedData.nama, alasan: "Pengajuan SKD", pengaju: "via aplikasi" });

    revalidatePath(PATHS.SKD_REQUEST);
    return { success: true, message: MESSAGE.PERMOHONAN_SKD.CREATE_OK, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.PERMOHONAN_SKD.CREATE_FAIL);
  }
}