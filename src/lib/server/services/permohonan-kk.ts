import { prisma } from "@/lib/prisma";

export const countPermohonanKKService = async () => {
  return prisma.permohonanKK.count();
};

export const findManyPermohonanKKService = async () => {
  return prisma.permohonanKK.findMany({ orderBy: { createdAt: "desc" }, include: { user: true } });
};

export const findPermohonanKKByIdService = async (id: string) => {
  return prisma.permohonanKK.findUnique({ where: { permohonanKKId: id }, include: { user: true } });
};

export const findManyPermohonanKKByUserService = async (userId: string) => {
  return prisma.permohonanKK.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
};

export const createPermohonanKKService = async (userId: string, data: unknown) => {
  return prisma.permohonanKK.create({ data: { ...(data as object), userId } });
};

export const updateStatusPermohonanKKService = async (id: string, data: { statusPermohonan: "DIAJUKAN" | "DISETUJUI" | "DITOLAK"; catatan?: string }) => {
  return prisma.permohonanKK.update({ where: { permohonanKKId: id }, data });
};

export const deletePermohonanKKService = async (id: string) => {
  return prisma.permohonanKK.delete({ where: { permohonanKKId: id } });
};
