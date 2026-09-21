"use server"

import { RESPONSE_MESSAGE } from "@/constants/response-message";
import { findCurrentSessionService } from "../services/session";
import { TChangePasswordSchema } from "@/lib/validators/account";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { verifyPasswordHash } from "../utils/password";
import { updateUserPasswordService } from "../services/user";
import { errorHandler } from "../services/error";

export const changePasswordAction = async (payload: TChangePasswordSchema) => {
    try {
        const message = RESPONSE_MESSAGE;
        const data = await findCurrentSessionService();
        if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);
        const isPasswordValid = await verifyPasswordHash(data.user.password, payload.password);
        if (!isPasswordValid) throw new ApiError(status.UNAUTHORIZED, message.AUTH.SIGN_IN_INCORRECT);
        await updateUserPasswordService(data.user.userId, payload.newPassword);
        return { status: status.OK, message: message.AUTH.SIGN_IN_OK };
    } catch (error) {
        return errorHandler(error);
    }
}