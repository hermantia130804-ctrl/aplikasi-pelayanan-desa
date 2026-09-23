"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKLSchema, TUpdatePermohonanSKLSchema, updatePermohonanSKLStatusSchema } from "@/lib/validators/permohonan-skl";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
    createPermohonanSKLService,
    deletePermohonanSKLService,
    updatePermohonanSKLService,
    updatePermohonanSKLStatusService
} from "../services/permohonan-skl";
import { findCurrentSessionService } from "../services/session";

export const createPermohonanSKLAction = async (
  payload: TCreatePermohonanSKLSchema,
) => {
  const message = MESSAGE.SKL_REQUEST || MESSAGE.GLOBAL;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    const data = await createPermohonanSKLService(currentSession.user.userId, payload);
    revalidatePath(PATHS.SKL_REQUEST || "/permohonan-skl");
    return { status: status.OK, message: message.CREATE_OK || "Permohonan SKL berhasil dibuat", data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.CREATE_FAIL || "Gagal membuat permohonan SKL");
    return errorHandler(defaultError);
  }
};

export const updatePermohonanSKLAction = async (
  id: string,
  payload: TUpdatePermohonanSKLSchema
) => {
  const message = MESSAGE.SKL_REQUEST || MESSAGE.GLOBAL;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    const data = await updatePermohonanSKLService(id, payload);
    revalidatePath(PATHS.SKL_REQUEST || "/permohonan-skl");
    return { status: status.OK, message: message.UPDATE_OK || "Permohonan SKL berhasil diperbarui", data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.UPDATE_FAIL || "Gagal memperbarui permohonan SKL");
    return errorHandler(defaultError);
  }
};

export const updatePermohonanSKLStatusAction = async (
  permohonanSKLId: string,
  values: unknown
) => {
  const message = MESSAGE.SKL_REQUEST || MESSAGE.GLOBAL;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    
    const validatedData = updatePermohonanSKLStatusSchema.parse(values);
    const data = await updatePermohonanSKLStatusService(
      permohonanSKLId, 
      validatedData.statusPermohonan, 
      validatedData.nomorPermohonan,
      validatedData.catatan
    );
    
    revalidatePath(PATHS.SKL_REQUEST || "/permohonan-skl");
    return { status: status.OK, message: message.UPDATE_OK || "Status permohonan SKL berhasil diperbarui", data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.UPDATE_FAIL || "Gagal memperbarui status permohonan SKL");
    return errorHandler(defaultError);
  }
};

export const deletePermohonanSKLAction = async (id: string) => {
  const message = MESSAGE.SKL_REQUEST || MESSAGE.GLOBAL;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    await deletePermohonanSKLService(id);
    revalidatePath(PATHS.SKL_REQUEST || "/permohonan-skl");
    return { status: status.OK, message: message.DELETE_OK || "Permohonan SKL berhasil dihapus" };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.DELETE_FAIL || "Gagal menghapus permohonan SKL");
    return errorHandler(defaultError);
  }
};
