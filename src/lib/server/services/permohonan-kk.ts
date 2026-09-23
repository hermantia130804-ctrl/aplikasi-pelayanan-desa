import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { TCreatePermohonanKKSchema, TFindManyPermohonanKKSchema } from "@/lib/validators/permohonan-kk";

export const countPermohonanKKService = async (where?: Prisma.PermohonanKKWhereInput) => {
  return prisma.permohonanKK.count({ where });
};

export const findManyPermohonanKKService = async (params: TFindManyPermohonanKKSchema) => {
  const skip = (params.page - 1) * params.limit;
  const take = params.limit;
  const orderBy = { [params.orderBy]: params.orderDirection.toLowerCase() };
  const where: Prisma.PermohonanKKWhereInput = {
    AND: [
      { alasanPermohonan: params.alasan },
      { statusPermohonan: params.status },
      { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
      { [params.searchBy]: { contains: params.searchValue, mode: "insensitive" } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.permohonanKK.findMany({ take, skip, where, orderBy, include: { user: true } }),
    countPermohonanKKService(where),
  ]);

  const pagination = {
    totalItems: total,
    currentPage: params.page,
    totalPages: Math.ceil(total / params.limit),
  };

  return { data, pagination };
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

export const updatePermohonanKKService = async (id: string, data: Partial<TCreatePermohonanKKSchema>) => {
  return prisma.permohonanKK.update({ where: { permohonanKKId: id }, data });
};
