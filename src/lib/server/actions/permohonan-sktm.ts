"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKTMSchema, TUpdatePermohonanSKTMSchema, TUpdateStatusPermohonanSKTMSchema } from "@/lib/validators/permohonan-sktm";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
  createPermohonanSKTMService,
  deletePermohonanSKTMService,
  updatePermohonanSKTMService,
  updateStatusPermohonanSKTMService
} from "../services/permohonan-sktm";
import { findCurrentSessionService } from "../services/session";

export const createPermohonanSKTMAction = async (
  payload: TCreatePermohonanSKTMSchema,
) => {
  const message = MESSAGE.SKTM_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const data = await createPermohonanSKTMService(currentSession.user.userId, payload);
    revalidatePath(PATHS.SKTM_REQUEST);
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

export const updatePermohonanSKTMAction = async (
  payload: TUpdatePermohonanSKTMSchema,
) => {
  const message = MESSAGE.SKTM_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    
    const { permohonanSKTMId, ...updateData } = payload;
    const data = await updatePermohonanSKTMService(permohonanSKTMId, updateData);
    
    revalidatePath(PATHS.SKTM_REQUEST);
    revalidatePath(`${PATHS.SKTM_REQUEST}/${permohonanSKTMId}`);
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

export const deletePermohonanSKTMAction = async (permohonanSKTMId: string) => {
  const message = MESSAGE.SKTM_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    
    await deletePermohonanSKTMService(permohonanSKTMId);
    revalidatePath(PATHS.SKTM_REQUEST);
    return { status: status.OK, message: message.DELETE_OK };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error instanceof ApiError) throw error;
    }
    const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, message.DELETE_FAIL);
    return errorHandler(defaultError);
  }
};

export const updateStatusPermohonanSKTMAction = async (
  payload: TUpdateStatusPermohonanSKTMSchema,
) => {
  const message = MESSAGE.SKTM_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    
    const { permohonanSKTMId, statusPermohonan, nomorPermohonan, catatan } = payload;
    const data = await updateStatusPermohonanSKTMService(permohonanSKTMId, statusPermohonan, nomorPermohonan, catatan);
    
    revalidatePath(PATHS.SKTM_REQUEST);
    revalidatePath(`${PATHS.SKTM_REQUEST}/${permohonanSKTMId}`);
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
