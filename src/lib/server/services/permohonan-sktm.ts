import { Prisma, StatusPermohonan } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { TCreatePermohonanSKTMSchema, TFindManyPermohonanSKTMSchema, TUpdatePermohonanSKTMSchema } from "@/lib/validators/permohonan-sktm";

const includeUser = {
  select: {
    userId: true,
    name: true,
    email: true,
    role: true,
  },
};

export const countPermohonanSKTMService = async (where: Prisma.PermohonanSKTMWhereInput) => {
  return prisma.permohonanSKTM.count({ where });
};

export const findManyPermohonanSKTMService = async (
  params: TFindManyPermohonanSKTMSchema
) => {
  const skip = (params.page - 1) * params.limit;
  const take = params.limit;
  const orderBy = { [params.orderField || 'createdAt']: params.orderDirection.toLowerCase() };
  const where: Prisma.PermohonanSKTMWhereInput = {
    AND: [
      { statusPermohonan: params.status },
      { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
      params.search && params.searchField
        ? { [params.searchField]: { contains: params.search, mode: "insensitive" } }
        : {},
    ].filter(Boolean),
  };

  return prisma.permohonanSKTM.findMany({
    skip,
    take,
    where,
    orderBy,
    include: {
      user: includeUser,
    },
  });
};

export const findByIdPermohonanSKTMService = async (permohonanSKTMId: string) => {
  return prisma.permohonanSKTM.findUnique({
    where: { permohonanSKTMId },
    include: {
      user: includeUser,
    },
  });
};

export const createPermohonanSKTMService = async (
  userId: string,
  data: TCreatePermohonanSKTMSchema
) => {
  return prisma.permohonanSKTM.create({
    data: {
      ...data,
      userId,
    },
    include: {
      user: includeUser,
    },
  });
};

export const updatePermohonanSKTMService = async (
  permohonanSKTMId: string,
  data: Omit<TUpdatePermohonanSKTMSchema, "permohonanSKTMId">
) => {
  return prisma.permohonanSKTM.update({
    where: { permohonanSKTMId },
    data,
    include: {
      user: includeUser,
    },
  });
};

export const updateStatusPermohonanSKTMService = async (
  permohonanSKTMId: string,
  statusPermohonan: StatusPermohonan,
  nomorPermohonan?: string,
  catatan?: string
) => {
  return prisma.permohonanSKTM.update({
    where: { permohonanSKTMId },
    data: {
      statusPermohonan,
      nomorPermohonan,
      catatan,
    },
    include: {
      user: includeUser,
    },
  });
};

export const deletePermohonanSKTMService = async (permohonanSKTMId: string) => {
  return prisma.permohonanSKTM.delete({
    where: { permohonanSKTMId },
  });
};
