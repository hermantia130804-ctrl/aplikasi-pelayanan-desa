"use server"

import { MESSAGE } from "@/constants/message";
import { emailVerificationSchema, forgotPasswordSchema, resetPasswordSchema, TEmailVerificationSchema, TForgotPasswordSchema, TResetPasswordSchema, TSignInSchema } from "@/lib/validators/auth";
import { TCreateUserSchema } from "@/lib/validators/user";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { consumeEmailVerificationService, createEmailVerificationService, validateEmailVerificationService } from "../services/email-verification";
import { errorHandler } from "../services/error";
import { consumeForgotPasswordService, createForgotPasswordService, validateForgotPasswordService } from "../services/forgot-password";
import { createSessionService, findCurrentSessionService, invalidateSessionService } from "../services/session";
import { activateUserService, createUserService, findUserByEmailService, updateUserAsVerifiedService, updateUserPasswordService } from "../services/user";
import { verifyPasswordHash } from "../utils/password";
import { setSessionTokenCookie } from "../utils/session";

export const signInAction = async (payload: TSignInSchema) => {
    try {
        const global = MESSAGE.GLOBAL;
        const message = MESSAGE.AUTH;
        const { email, password } = payload;
        const { data } = await findUserByEmailService(email);
        if (!data) throw new ApiError(status.UNAUTHORIZED, global.UNAUTHORIZED);
        if (!data.verifiedAt) throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_NOT_VERIFIED);
        if (data.status !== "ACTIVE") throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_NOT_ACTIVE);
        const isPasswordValid = await verifyPasswordHash(data.password, password);
        if (!isPasswordValid) throw new ApiError(status.UNAUTHORIZED, message.SIGN_IN_INCORRECT);
        const session = await createSessionService(data.userId);
        await setSessionTokenCookie(session.data.sessionId, session.data.expiresAt);
        return { status: status.OK, message: message.SIGN_IN_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const signUpAction = async (payload: TCreateUserSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const { data } = await findUserByEmailService(payload.email);
        if (data) throw new ApiError(status.BAD_REQUEST, message.SIGN_UP_ALREADY_EXISTS);
        const user = await createUserService(payload);
        await createEmailVerificationService(user.data.userId);
        return { status: status.OK, message: message.SIGN_UP_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const signOutAction = async () => {
    try {
        const global = MESSAGE.GLOBAL;
        const message = MESSAGE.AUTH;
        const session = await findCurrentSessionService();
        if (!session) throw new ApiError(status.UNAUTHORIZED, global.UNAUTHORIZED);
        await invalidateSessionService(session.session.sessionId);
        return { status: status.OK, message: message.SIGN_OUT_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const forgotPasswordAction = async (payload: TForgotPasswordSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const parsed = forgotPasswordSchema.parse(payload);
        const { data } = await findUserByEmailService(parsed.email);
        if (!data) throw new ApiError(status.BAD_REQUEST, message.EMAIL_NOT_FOUND);
        await createForgotPasswordService(data.userId);
        //EMAIL
        return { status: status.OK, message: message.FORGOT_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const resetPasswordAction = async (payload: TResetPasswordSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const parsed = resetPasswordSchema.parse(payload);
        const { data: forgotPassword } = await validateForgotPasswordService(parsed.forgotPasswordId);
        await updateUserPasswordService(forgotPassword.userId, parsed.password);
        await consumeForgotPasswordService(forgotPassword.forgotPasswordId);
        return { status: status.OK, message: message.FORGOT_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const emailVerificationAction = async (payload: TEmailVerificationSchema) => {
    try {
        const message = MESSAGE.AUTH;
        const parsed = emailVerificationSchema.parse(payload);
        const { data } = await findUserByEmailService(parsed.email);
        if (!data) throw new ApiError(status.BAD_REQUEST, message.EMAIL_NOT_FOUND);
        await createEmailVerificationService(data.userId);
        //EMAIL
        return { status: status.OK, message: message.EMAIL_VERIFICATION_OK };
    } catch (error) {
        return errorHandler(error);
    }
}

export const validateEmailVerificationAction = async (id: string) => {
    try {
        const message = MESSAGE.AUTH;
        const { data } = await validateEmailVerificationService(id);
        await updateUserAsVerifiedService(data.userId);
        await activateUserService(data.userId);
        await consumeEmailVerificationService(data.emailVerificationId);
        return { status: status.OK, message: message.EMAIL_VERIFICATION_OK };
    } catch (error) {
        return errorHandler(error);
    }
};
