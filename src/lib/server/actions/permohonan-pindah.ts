"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { createPermohonanPindahService, deletePermohonanPindahService, followUpPermohonanPindahService, updatePermohonanPindahService } from "@/lib/server/services/permohonan-pindah";
import { errorHandler } from "@/lib/server/services/error";
import { TCreatePermohonanPindahSchema, TFollowUpPermohonanPindahSchema, TUpdatePermohonanPindahSchema } from "@/lib/validators/permohonan-pindah";
import { ApiError } from "next/dist/server/api-utils";
import { revalidatePath } from "next/cache";
import status from "http-status";

export const createPermohonanPindahAction = async (payload: TCreatePermohonanPindahSchema) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);
    
    await createPermohonanPindahService(data.user.userId, payload);
    revalidatePath(PATHS.PINDAH_REQUEST);
    
    return { status: status.OK, message: message.PERMOHONAN_PINDAH.CREATE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updatePermohonanPindahAction = async (id: string, payload: TUpdatePermohonanPindahSchema) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);
    
    await updatePermohonanPindahService(id, payload);
    revalidatePath(PATHS.PINDAH_REQUEST);
    revalidatePath(`${PATHS.PINDAH_REQUEST}/${id}`);
    
    return { status: status.OK, message: message.PERMOHONAN_PINDAH.UPDATE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deletePermohonanPindahAction = async (id: string) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);
    
    await deletePermohonanPindahService(id);
    revalidatePath(PATHS.PINDAH_REQUEST);
    
    return { status: status.OK, message: message.PERMOHONAN_PINDAH.DELETE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};

export const followUpPermohonanPindahAction = async (payload: TFollowUpPermohonanPindahSchema) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);
    
    await followUpPermohonanPindahService(
      payload.permohonanPindahId,
      payload.statusPermohonan,
      payload.nomorPermohonan,
      payload.catatan
    );
    revalidatePath(PATHS.PINDAH_REQUEST);
    revalidatePath(`${PATHS.PINDAH_REQUEST}/${payload.permohonanPindahId}`);
    
    return { status: status.OK, message: message.PERMOHONAN_PINDAH.UPDATE_STATUS_OK };
  } catch (error) {
    return errorHandler(error);
  }
};
