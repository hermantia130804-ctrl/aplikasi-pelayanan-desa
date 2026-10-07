"use server";

import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { prisma } from "@/lib/prisma";
import { MESSAGE } from "@/constants/message";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { createDataWargaSchema, updateDataWargaSchema } from "@/lib/validators/data-warga";

const requireSession = async () => {
  const session = await findCurrentSessionService();
  if (!session?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return session;
};

const requireStaff = async () => {
  const s = await requireSession();
  if (s.user.role !== "ADMIN" && s.user.role !== "PETUGAS") {
    throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat mengakses.");
  }
  return s;
};

// ===== RT: daftar warga wilayahnya (staff: semua) =====
export const findManyDataWargaAction = async () => {
  try {
    const session = await requireSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const data = await prisma.dataWarga.findMany({
      where: isStaff ? {} : { userId: session.user.userId },
      orderBy: [{ noRt: "asc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true, noRt: true, noRw: true } } },
    });
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Detail (pemilik/staff) =====
export const findDataWargaByIdAction = async (id: string) => {
  try {
    const session = await requireSession();
    const data = await prisma.dataWarga.findUnique({ where: { dataWargaId: id }, include: { user: { select: { name: true } } } });
    if (!data) throw new ApiError(status.NOT_FOUND, "Data warga tidak ditemukan.");
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff && data.userId !== session.user.userId) {
      throw new ApiError(status.FORBIDDEN, "Tidak berhak.");
    }
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== RT: input warga =====
export const createDataWargaAction = async (payload: unknown) => {
  try {
    const session = await requireSession();
    if (session.user.role !== "RT") {
      throw new ApiError(status.FORBIDDEN, "Hanya Ketua RT yang dapat menginput data warga.");
    }
    const user = await prisma.user.findUnique({ where: { userId: session.user.userId } });
    if (!user?.noRt || !user.noRw) {
      throw new ApiError(status.BAD_REQUEST, "Akun RT belum memiliki data wilayah (No RT/RW). Hubungi admin.");
    }
    const parsed = createDataWargaSchema.parse(payload);

    const data = await prisma.dataWarga.create({
      data: {
        ...parsed,
        userId: session.user.userId,
        noRt: user.noRt,
        noRw: user.noRw,
      },
    });

    revalidatePath("/data-warga");
    revalidatePath("/kelola-data-warga");
    return { status: status.OK, message: "Data warga berhasil disimpan", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== RT: edit (hanya miliknya) =====
export const updateDataWargaAction = async (id: string, payload: unknown) => {
  try {
    const session = await requireSession();
    const parsed = updateDataWargaSchema.parse(payload);

    const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: id } });
    if (!existing) throw new ApiError(status.NOT_FOUND, "Data warga tidak ditemukan.");
    if (session.user.role !== "ADMIN" && existing.userId !== session.user.userId) {
      throw new ApiError(status.FORBIDDEN, "Tidak berhak mengubah data ini.");
    }

    const data = await prisma.dataWarga.update({ where: { dataWargaId: id }, data: parsed });
    revalidatePath("/data-warga");
    revalidatePath("/kelola-data-warga");
    return { status: status.OK, message: "Data warga berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Hapus (RT miliknya / staff semua) =====
export const deleteDataWargaAction = async (id: string) => {
  try {
    const session = await requireSession();
    const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: id } });
    if (!existing) throw new ApiError(status.NOT_FOUND, "Data warga tidak ditemukan.");
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff && existing.userId !== session.user.userId) {
      throw new ApiError(status.FORBIDDEN, "Tidak berhak menghapus.");
    }

    await prisma.dataWarga.delete({ where: { dataWargaId: id } });
    revalidatePath("/data-warga");
    revalidatePath("/kelola-data-warga");
    return { status: status.OK, message: "Data warga berhasil dihapus" };
  } catch (error) {
    return errorHandler(error);
  }
};
