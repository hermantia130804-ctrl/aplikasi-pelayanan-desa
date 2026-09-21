import { prisma } from "@/lib/prisma";
import { generateSecureRandomString } from "../utils/random";
import { hashPassword, verifyPasswordHash } from "../utils/password";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { MESSAGE } from "@/constants/message";

export const createForgotPasswordService = async (userId: string) => {
    const id = generateSecureRandomString();
    const secret = generateSecureRandomString();
    const secretHash = await hashPassword(secret);
    const forgotPasswordId = `${id}.${secret}`;
    const expiresAt = new Date(Date.now() + 3600000);
    const data = await prisma.forgotPassword.create({ data: { forgotPasswordId, userId, secretHash, expiresAt } });
    return { data };
}

export const findForgotPasswordService = async (requestId: string) => {
    const data = await prisma.forgotPassword.findUnique({ where: { forgotPasswordId: requestId } });
    return { data };
}

export const consumeForgotPasswordService = async (forgotPasswordId: string) => {
    const data = await prisma.forgotPassword.update({ where: { forgotPasswordId }, data: { consumedAt: new Date() } });
    return { data };
}

export const validateForgotPasswordService = async (forgotPasswordId: string) => {
    const message = MESSAGE.AUTH;
    const secret = forgotPasswordId.split(".")[1]
    const data = await prisma.forgotPassword.findUnique({ where: { forgotPasswordId } });
    if (!data) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_NOT_FOUND);
    const isSecretValid = await verifyPasswordHash(data.secretHash, secret);
    if (!isSecretValid) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_EXPIRED);
    if (data.expiresAt < new Date()) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_EXPIRED);
    if (data.consumedAt) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_ALREADY_USED);
    return { data };
}

export const invalidateForgotPasswordService = async (forgotPasswordId: string) => {
    await prisma.forgotPassword.delete({ where: { forgotPasswordId } });
    return { data: true };
}

