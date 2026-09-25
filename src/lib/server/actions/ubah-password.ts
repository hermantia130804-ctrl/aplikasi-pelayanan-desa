"use server";

import { MESSAGE } from "@/constants/message";
import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { prisma } from "@/lib/prisma";
import { verifyPasswordHash, hashPassword, verifyPasswordStrength } from "../utils/password";

export const ubahPasswordAction = async (payload: {
  passwordLama: string;
  passwordBaru: string;
  konfirmasiPassword: string;
}) => {
  try {
    const currentSession = await findCurrentSessionService();
    if (!currentSession?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");

    const user = await prisma.user.findUnique({ where: { userId: currentSession.user.userId } });
    if (!user) throw new ApiError(status.NOT_FOUND, "Akun tidak ditemukan");

    const isLamaValid = await verifyPasswordHash(user.password, payload.passwordLama);
    if (!isLamaValid) throw new ApiError(status.BAD_REQUEST, "Password lama tidak sesuai");

    if (payload.passwordBaru !== payload.konfirmasiPassword) {
      throw new ApiError(status.BAD_REQUEST, "Konfirmasi password tidak cocok");
    }

    const isKuat = await verifyPasswordStrength(payload.passwordBaru);
    if (!isKuat) throw new ApiError(status.BAD_REQUEST, "Password minimal 8 karakter dan tidak termasuk password yang bocor secara umum");

    const passwordBaruHash = await hashPassword(payload.passwordBaru);
    await prisma.user.update({
      where: { userId: user.userId },
      data: { password: passwordBaruHash },
    });

    return { status: status.OK, message: "Password berhasil diubah" };
  } catch (error) {
    return errorHandler(error);
  }
};
