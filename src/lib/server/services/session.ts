import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { generateSecureRandomString } from "../utils/random";
import { hashPassword, verifyPasswordHash } from "../utils/password";
import { cache } from "react";

export const createSessionService = async (userId: string) => {
    const id = generateSecureRandomString();
    const secret = generateSecureRandomString();
    const secretHash = await hashPassword(secret);
    const sessionId = id + "." + secret;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const data = await prisma.session.create({ data: { userId, sessionId, secretHash, expiresAt } });
    return { data };
}

export const validateSessionService = async (sessionId: string) => {
    const secret = sessionId.split(".")[1];
    const data = await prisma.session.findUnique({ where: { sessionId }, include: { user: true } });
    if (!data) return { data: null };
    const isSecretValid = await verifyPasswordHash(data.secretHash, secret);
    if (!isSecretValid) return { data: null };
    if (data.expiresAt < new Date()) return { data: null };
    const { user, ...session } = data;
    return { data: { user, session } };
}

export const invalidateSessionService = async (sessionId: string) => {
    await prisma.session.delete({ where: { sessionId } });
    return { data: true };
}

export const invalidateUserSessionsService = async (userId: string) => {
    await prisma.session.deleteMany({ where: { userId } });
    return { data: true };
}

export const findCurrentSessionService = cache(async () => {
    const store = await cookies();
    const token = store.get("session")?.value ?? null;
    if (token === null) return null;
    const result = await validateSessionService(token);
    return result.data;
})