"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKUSchema, TUpdatePermohonanSKUSchema, followUpPermohonanSKUSchema } from "@/lib/validators/permohonan-sku";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
    createPermohonanSKUService,
    deletePermohonanSKUService,
    updatePermohonanSKUService,
    followUpPermohonanSKUService
} from "../services/permohonan-sku";
import { findCurrentSessionService } from "../services/session";

export const createPermohonanSKUAction = async (
  payload: TCreatePermohonanSKUSchema,
) => {
  const message = MESSAGE.PERMOHONAN_SKU;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    const data = await createPermohonanSKUService(currentSession.user.userId, payload);
    revalidatePath(PATHS.SKU_REQUEST);
    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.CREATE_FAIL);
    return errorHandler(defaultError);
  }
};

export const updatePermohonanSKUAction = async (
  id: string,
  payload: TUpdatePermohonanSKUSchema
) => {
  const message = MESSAGE.PERMOHONAN_SKU;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    const data = await updatePermohonanSKUService(id, payload);
    revalidatePath(PATHS.SKU_REQUEST);
    return { status: status.OK, message: message.UPDATE_OK, data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.UPDATE_FAIL);
    return errorHandler(defaultError);
  }
};

export const followUpPermohonanSKUAction = async (
  values: unknown
) => {
  const message = MESSAGE.PERMOHONAN_SKU;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    
    const validatedData = followUpPermohonanSKUSchema.parse(values);
    const data = await followUpPermohonanSKUService(
      validatedData.permohonanSKUId,
      validatedData.statusPermohonan,
      validatedData.nomorPermohonan,
      validatedData.catatan
    );
    revalidatePath(PATHS.SKU_REQUEST);
    return { status: status.OK, message: message.UPDATE_STATUS_OK, data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.UPDATE_STATUS_FAIL);
    return errorHandler(defaultError);
  }
};

export const deletePermohonanSKUAction = async (id: string) => {
  const message = MESSAGE.PERMOHONAN_SKU;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    const data = await deletePermohonanSKUService(id);
    revalidatePath(PATHS.SKU_REQUEST);
    return { status: status.OK, message: message.DELETE_OK, data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.DELETE_FAIL);
    return errorHandler(defaultError);
  }
};
