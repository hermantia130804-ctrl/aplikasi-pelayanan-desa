"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { followUpPermohonanKTPSchema, TCreatePermohonanKTPSchema, TUpdatePermohonanKTPSchema } from "@/lib/validators/permohonan-ktp";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
  createPermohonanKTPService,
  deletePermohonanKTPService,
  followUpPermohonanKTPService,
  updatePermohonanKTPService
} from "../services/permohonan-ktp";
import { findCurrentSessionService } from "../services/session";

export const createPermohonanKTPAction = async (
  payload: TCreatePermohonanKTPSchema,
) => {
  const message = MESSAGE.KTP_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const data = await createPermohonanKTPService(currentSession.user.userId, payload);
    revalidatePath(PATHS.KTP_REQUEST);
    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updatePermohonanKTPAction = async (
  id: string,
  payload: TUpdatePermohonanKTPSchema
) => {
  const message = MESSAGE.KTP_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    const data = await updatePermohonanKTPService(id, payload);
    revalidatePath(PATHS.KTP_REQUEST);
    return { status: status.OK, message: message.UPDATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};


export const deletePermohonanKTPAction = async (id: string) => {
  const message = MESSAGE.KTP_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    await deletePermohonanKTPService(id);
    revalidatePath(PATHS.KTP_REQUEST);
    return { status: status.OK, message: message.DELETE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};

export const followUpPermohonanKTPAction = async (payload: unknown) => {
  try {
    const parsed = followUpPermohonanKTPSchema.safeParse(payload);
    if (!parsed.success) throw new ApiError(status.BAD_REQUEST, parsed.error.message);
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    await followUpPermohonanKTPService(parsed.data.permohonanKtpId, parsed.data);
    revalidatePath(PATHS.KTP_REQUEST);
    return { status: status.OK, message: MESSAGE.KTP_REQUEST.FOLLOW_UP_OK };
  } catch (error) {
    return errorHandler(error);
  }
}
