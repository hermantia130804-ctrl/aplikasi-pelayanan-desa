"use server";

import { deletePermohonanWithFiles } from "../services/permohonan-delete";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { TCreatePermohonanSKKSchema, TUpdatePermohonanSKKSchema, followUpPermohonanSKKSchema } from "@/lib/validators/permohonan-skk";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import {
  createPermohonanSKKService,
  deletePermohonanSKKService,
  followUpPermohonanSKKService,
  updatePermohonanSKKService
} from "../services/permohonan-skk";
import { findCurrentSessionService } from "../services/session";
import { kirimEmailStatusWarga } from "../services/permohonan-email-status";

export const createPermohonanSKKAction = async (
  payload: TCreatePermohonanSKKSchema,
) => {
  const message = MESSAGE.SKK_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN" && currentSession.user.role !== "PETUGAS") throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat melakukan aksi ini");
    const data = await createPermohonanSKKService(currentSession.user.userId, payload);
    revalidatePath(PATHS.SKK_REQUEST);
    return { status: status.OK, message: message.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updatePermohonanSKKAction = async (
  id: string,
  payload: TUpdatePermohonanSKKSchema
) => {
  const message = MESSAGE.SKK_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN" && currentSession.user.role !== "PETUGAS") throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat melakukan aksi ini");
    const data = await updatePermohonanSKKService(id, payload);
    revalidatePath(PATHS.SKK_REQUEST);
    return { status: status.OK, message: message.UPDATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const followUpPermohonanSKKAction = async (values: unknown) => {
  const message = MESSAGE.SKK_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN" && currentSession.user.role !== "PETUGAS") throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat melakukan aksi ini");

    const { permohonanSKKId, ...validatedData } = followUpPermohonanSKKSchema.parse(values);
    const data = await followUpPermohonanSKKService(permohonanSKKId, validatedData);
    try { await kirimEmailStatusWarga("SKK", permohonanSKKId); } catch (e) { console.error("GAGAL EMAIL STATUS SKK:", e); }
    revalidatePath(PATHS.SKK_REQUEST);
    return { status: status.OK, message: message.UPDATE_STATUS_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deletePermohonanSKKAction = async (id: string) => {
  const message = MESSAGE.SKK_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN" && currentSession.user.role !== "PETUGAS") throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat melakukan aksi ini");
    const data = await deletePermohonanWithFiles("SKK", id);
    revalidatePath(PATHS.SKK_REQUEST);
    return { status: status.OK, message: message.DELETE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};
