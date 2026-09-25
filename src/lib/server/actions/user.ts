"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { Role } from "@/generated/prisma";
import {
  TCreateUserSchema,
  TFindManyUserSchema,
  TUpdateUserSchema,
  TUpdateUserPasswordSchema,
} from "@/lib/validators/user";
import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { hashPassword, verifyPasswordStrength } from "../utils/password";
import {
  countUserService,
  createUserService,
  deleteUserService,
  findManyUserService,
  updateUserService,
  updateUserPasswordService,
} from "../services/user";
import { findCurrentSessionService } from "../services/session";

const requireFullAdmin = async () => {
  const currentSession = await findCurrentSessionService();
  if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
  if (currentSession.user.role !== "ADMIN") {
    throw new ApiError(status.FORBIDDEN, "Hanya Admin Full Control yang dapat melakukan aksi ini");
  }
  return currentSession;
};

export const createUserServiceAction = async (payload: TCreateUserSchema) => {
  try {
    await requireFullAdmin();
    const data = await createUserService(payload);
    revalidatePath(PATHS.USER);
    return { status: status.OK, message: MESSAGE.USER.CREATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updateUserAction = async (userId: string, payload: TUpdateUserSchema) => {
  try {
    await requireFullAdmin();

    const { password, ...restPayload } = payload;

    // Kalau admin mengisi password baru → validasi kekuatan (service yang hash 1x)
    if (password && password.trim() !== "") {
      const isKuat = await verifyPasswordStrength(password);
      if (!isKuat) {
        throw new ApiError(status.BAD_REQUEST, "Password minimal 8 karakter dan tidak termasuk password yang bocor secara umum");
      }
      await updateUserPasswordService(userId, password);
    }

    const data = await updateUserService(userId, restPayload);
    revalidatePath(PATHS.USER);
    return { status: status.OK, message: MESSAGE.USER.UPDATE_OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updateUserPasswordAction = async (userId: string, payload: TUpdateUserPasswordSchema) => {
  try {
    await requireFullAdmin();
    await updateUserPasswordService(userId, payload.password);
    return { status: status.OK, message: "Password berhasil diperbarui" };
  } catch (error) {
    return errorHandler(error);
  }
};

export const findManyUserAction = async (query: TFindManyUserSchema) => {
  try {
    await requireFullAdmin();
    const { data, pagination } = await findManyUserService(query);
    return { status: status.OK, data, pagination };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deleteUserAction = async (userId: string) => {
  try {
    const currentSession = await requireFullAdmin();
    if (currentSession.user.userId === userId) {
      throw new ApiError(status.BAD_REQUEST, "Tidak dapat menghapus akun Anda sendiri");
    }
    await deleteUserService(userId);
    revalidatePath(PATHS.USER);
    return { status: status.OK, message: MESSAGE.USER.DELETE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};
