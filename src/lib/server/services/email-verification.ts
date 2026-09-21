import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPasswordHash } from "../utils/password";
import { generateSecureRandomString } from "../utils/random";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import moment from "moment";
import { MESSAGE } from "@/constants/message";

export const createEmailVerificationService = async (userId: string) => {
    const id = generateSecureRandomString();
    const secret = generateSecureRandomString();
    const secretHash = await hashPassword(secret);
    const emailVerificationId = `${id}.${secret}`;
    const expiresAt = new Date(Date.now() + 3600000);
    const data = await prisma.emailVerification.create({ data: { emailVerificationId, userId, secretHash, expiresAt } });
    return { data };
}

export const findEmailVerificationService = async (requestId: string) => {
    const data = await prisma.emailVerification.findUnique({ where: { emailVerificationId: requestId } });
    return { data };
}

export const consumeEmailVerificationService = async (emailVerificationId: string) => {
    const data = await prisma.emailVerification.update({ where: { emailVerificationId }, data: { consumedAt: new Date() } });
    return { data };
}

export const validateEmailVerificationService = async (emailVerificationId: string) => {
    const message = MESSAGE.AUTH;
    const secret = emailVerificationId.split(".")[1]
    const data = await prisma.emailVerification.findUnique({ where: { emailVerificationId } });
    if (!data) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_NOT_FOUND);
    const isSecretValid = await verifyPasswordHash(data.secretHash, secret);
    if (!isSecretValid) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_EXPIRED);
    const isExpires = moment(data.expiresAt).isBefore(moment());
    if (isExpires) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_EXPIRED);
    if (data.consumedAt) throw new ApiError(status.BAD_REQUEST, message.EMAIL_VERIFICATION_ALREADY_USED);
    return { data };
}

export const invalidateEmailVerificationService = async (emailVerificationId: string) => {
    await prisma.emailVerification.delete({ where: { emailVerificationId } });
    return { data: true };
}

