"use server";

import { deletePermohonanWithFiles } from "../services/permohonan-delete";

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
  updatePermohonanKTPService,
  updateStatusPermohonanKTPService
} from "../services/permohonan-ktp";
import { findCurrentSessionService } from "../services/session";
import { kirimEmailStatusWarga } from "../services/permohonan-email-status";

export const createPermohonanKTPAction = async (
  payload: TCreatePermohonanKTPSchema,
) => {
  const message = MESSAGE.KTP_REQUEST;
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
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
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
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
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    await deletePermohonanWithFiles("KTP", id);
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
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    await followUpPermohonanKTPService(parsed.data.permohonanKtpId, parsed.data);
    try { await kirimEmailStatusWarga("KTP", parsed.data.permohonanKtpId); } catch (e) { console.error("GAGAL EMAIL STATUS KTP:", e); }
    revalidatePath(PATHS.KTP_REQUEST);
    return { status: status.OK, message: MESSAGE.KTP_REQUEST.FOLLOW_UP_OK };
  } catch (error) {
    return errorHandler(error);
  }
}

export const updatePermohonanKTPStatusAction = async (
  id: string,
  statusPermohonan: "DIAJUKAN" | "DISETUJUI" | "DITOLAK"
) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
    if (currentSession.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat melakukan aksi ini");
    await updateStatusPermohonanKTPService(id, { statusPermohonan });
    revalidatePath(PATHS.KTP_REQUEST);
    return { status: status.OK, message: MESSAGE.KTP_REQUEST.FOLLOW_UP_OK };
  } catch (error) {
    return errorHandler(error);
  }
};
