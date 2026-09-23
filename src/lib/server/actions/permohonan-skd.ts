"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { createPermohonanSKDSchema, followUpPermohonanSKDSchema, updatePermohonanSKDSchema } from "@/lib/validators/permohonan-skd";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { createPermohonanSKDService, deletePermohonanSKDService, followUpPermohonanSKDService, updatePermohonanSKDService } from "../services/permohonan-skd";
import { findCurrentSessionService } from "../services/session";

export async function createPermohonanSKDAction(formData: FormData) {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.GLOBAL.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");

    const rawData = Object.fromEntries(formData.entries());
    const parsedData = {
      ...rawData,
      tanggalLahir: new Date(rawData.tanggalLahir as string),
      expiresAt: new Date(rawData.expiresAt as string),
    };

    const validatedData = createPermohonanSKDSchema.parse(parsedData);
    const data = await createPermohonanSKDService(currentSession.user.userId, validatedData);
    revalidatePath(PATHS.SKD_REQUEST);
    return { success: true, message: MESSAGE.PERMOHONAN_SKD.CREATE_OK, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.PERMOHONAN_SKD.CREATE_FAIL);
  }
}

export async function updatePermohonanSKDAction(permohonanSKDId: string, formData: FormData) {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.GLOBAL.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");

    const rawData = Object.fromEntries(formData.entries());
    const parsedData = {
      ...rawData,
      ...(rawData.tanggalLahir && { tanggalLahir: new Date(rawData.tanggalLahir as string) }),
      ...(rawData.expiresAt && { expiresAt: new Date(rawData.expiresAt as string) }),
    };

    const validatedData = updatePermohonanSKDSchema.parse(parsedData);
    const data = await updatePermohonanSKDService(permohonanSKDId, validatedData);
    revalidatePath(PATHS.SKD_REQUEST);
    return { success: true, message: MESSAGE.PERMOHONAN_SKD.UPDATE_OK, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.PERMOHONAN_SKD.UPDATE_FAIL);
  }
}

export async function deletePermohonanSKDAction(permohonanSKDId: string) {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.GLOBAL.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");

    await deletePermohonanSKDService(permohonanSKDId);
    revalidatePath(PATHS.SKD_REQUEST);
    return { success: true, message: MESSAGE.PERMOHONAN_SKD.DELETE_OK };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.PERMOHONAN_SKD.DELETE_FAIL);
  }
}

export async function followUpPermohonanSKDAction(formData: FormData) {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.GLOBAL.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");

    const rawData = Object.fromEntries(formData.entries());
    const validatedData = followUpPermohonanSKDSchema.parse(rawData);
    
    const data = await followUpPermohonanSKDService(
      validatedData.permohonanSKDId,
      validatedData.statusPermohonan,
      validatedData.nomorPermohonan,
      validatedData.catatan
    );
    revalidatePath(PATHS.SKD_REQUEST);
    return { success: true, message: MESSAGE.PERMOHONAN_SKD.UPDATE_STATUS_OK, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.PERMOHONAN_SKD.UPDATE_STATUS_FAIL);
  }
}
