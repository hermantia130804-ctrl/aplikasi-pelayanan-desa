"use server"

import { MESSAGE } from "@/constants/message";
import { Role, Status } from "@/generated/prisma";
import { TCreateUserSchema, TUpdateUserSchema } from "@/lib/validators/user";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { updateUserStatusService, createUserService, deleteUserService, updateUserPasswordService, updateUserService, updateUserRoleService } from "../services/user";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/constants/paths";


export const createUserAction = async (payload: TCreateUserSchema) => {
    try {
        const currentSession = await findCurrentSessionService();
        if (!currentSession) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
        const { data } = await createUserService(payload);
        revalidatePath(PATHS.USER);
        return { status: status.OK, message: MESSAGE.USER.CREATE_OK, data: data };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.USER.CREATE_FAIL);
        return errorHandler(defaultError);
    }
}

export const updateUserAction = async (userId: string, payload: TUpdateUserSchema) => {
    try {
        const currentSession = await findCurrentSessionService();
        if (!currentSession) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
        const { data } = await updateUserService(userId, payload);
        revalidatePath(PATHS.USER);
        return { status: status.OK, message: MESSAGE.USER.UPDATE_OK, data: data };
    } catch (error) {
        console.log(error);
        const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.USER.UPDATE_FAIL);
        return errorHandler(defaultError);
    }
}

export const deleteUserAction = async (userId: string) => {
    try {
        const currentSession = await findCurrentSessionService();
        if (!currentSession) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
        const { data } = await deleteUserService(userId);
        revalidatePath(PATHS.USER);
        return { status: status.OK, message: MESSAGE.USER.DELETE_OK, data: data };
    } catch (error) {
        console.log(error);
        const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.USER.DELETE_FAIL);
        return errorHandler(defaultError);
    }
}

export const resetUserPasswordAction = async (userId: string, password: string) => {
    try {
        const currentSession = await findCurrentSessionService();
        if (!currentSession) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
        await updateUserPasswordService(userId, password);
        revalidatePath(PATHS.USER);
        return { status: status.OK, message: MESSAGE.USER.RESET_PASSWORD_OK };
    } catch (error) {
        console.log(error);
        const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.USER.RESET_PASSWORD_FAIL);
        return errorHandler(defaultError);
    }
}

export const updateUserStatusAction = async (userId: string, payload: Status) => {
    try {
        const currentSession = await findCurrentSessionService();
        if (!currentSession) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
        await updateUserStatusService(userId, payload);
        revalidatePath(PATHS.USER);
        return { status: status.OK, message: MESSAGE.USER.CHANGE_STATUS_OK };
    } catch (error) {
        console.log(error);
        const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.USER.CHANGE_STATUS_FAIL);
        return errorHandler(defaultError);
    }
}

export const updateUserRoleAction = async (userId: string, payload: Role) => {
    try {
        const currentSession = await findCurrentSessionService();
        if (!currentSession) throw new ApiError(status.UNAUTHORIZED, MESSAGE.AUTH.UNAUTHORIZED);
        await updateUserRoleService(userId, payload);
        revalidatePath(PATHS.USER);
        return { status: status.OK, message: MESSAGE.USER.CHANGE_ROLE_OK };
    } catch (error) {
        console.log(error);
        const defaultError = new ApiError(status.INTERNAL_SERVER_ERROR, MESSAGE.USER.CHANGE_ROLE_FAIL);
        return errorHandler(defaultError);
    }
}


