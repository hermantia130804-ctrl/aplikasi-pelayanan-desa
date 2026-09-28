import { prisma } from "@/lib/prisma";

export const findManyStrukturService = async () => {
  return prisma.strukturOrganisasi.findMany({ orderBy: { urutan: "asc" } });
};

export const findStrukturByIdService = async (id: string) => {
  return prisma.strukturOrganisasi.findUnique({ where: { strukturId: id } });
};

export const createStrukturService = async (data: { nama: string; jabatan: string; fotoUrl?: string | null; urutan: number; tingkat: number }) => {
  return prisma.strukturOrganisasi.create({ data });
};

export const updateStrukturService = async (id: string, data: { nama?: string; jabatan?: string; fotoUrl?: string | null; urutan?: number; tingkat?: number }) => {
  return prisma.strukturOrganisasi.update({ where: { strukturId: id }, data });
};

export const deleteStrukturService = async (id: string) => {
  return prisma.strukturOrganisasi.delete({ where: { strukturId: id } });
};
