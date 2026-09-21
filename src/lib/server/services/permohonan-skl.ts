import { Prisma, StatusPermohonan } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { TCreatePermohonanSKLSchema, TFindManyPermohonanSKLSchema, TUpdatePermohonanSKLSchema } from "@/lib/validators/permohonan-skl";

const includeUser = {
  select: {
    userId: true,
    name: true,
    email: true,
    role: true,
  },
};

export const countPermohonanSKLService = async (where: Prisma.PermohonanSKLWhereInput) => {
  return prisma.permohonanSKL.count({ where });
};

export const findManyPermohonanSKLService = async (
  params: TFindManyPermohonanSKLSchema
) => {
  const skip = (params.page - 1) * params.limit;
  const take = params.limit;
  const orderBy = { [params.orderField]: params.orderDirection.toLowerCase() };
  const where: Prisma.PermohonanSKLWhereInput = {
    AND: [
      { statusPermohonan: params.status },
      { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
      { [params.searchBy]: { contains: params.searchValue, mode: "insensitive" } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.permohonanSKL.findMany({ 
      take, 
      skip, 
      where, 
      orderBy,
      include: { user: includeUser }
    }),
    countPermohonanSKLService(where),
  ]);

  const pagination = {
    totalItems: total,
    currentPage: params.page,
    totalPages: Math.ceil(total / params.limit),
    hasNextPage: params.page < Math.ceil(total / params.limit),
    hasPrevPage: params.page > 1,
  };

  return { data, pagination };
};

export const findPermohonanSKLByIdService = async (id: string) => {
  return prisma.permohonanSKL.findUnique({
    where: { permohonanSKLId: id },
    include: { user: includeUser },
  });
};

export const createPermohonanSKLService = async (
  userId: string,
  data: TCreatePermohonanSKLSchema,
) => {
  return prisma.permohonanSKL.create({
    data: { ...data, userId },
    include: { user: includeUser },
  });
};

export const updatePermohonanSKLService = async (
  id: string,
  data: TUpdatePermohonanSKLSchema,
) => {
  return prisma.permohonanSKL.update({
    where: { permohonanSKLId: id },
    data,
    include: { user: includeUser },
  });
};

export const updatePermohonanSKLStatusService = async (
  id: string,
  statusPermohonan: StatusPermohonan,
  nomorPermohonan?: string,
  catatan?: string,
) => {
  return prisma.permohonanSKL.update({
    where: { permohonanSKLId: id },
    data: { 
      statusPermohonan, 
      nomorPermohonan,
      catatan,
    },
    include: { user: includeUser },
  });
};

export const deletePermohonanSKLService = async (id: string) => {
  return prisma.permohonanSKL.delete({ where: { permohonanSKLId: id } });
};
