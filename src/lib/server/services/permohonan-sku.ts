import { Prisma, StatusPermohonan } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { TCreatePermohonanSKUSchema, TFindManyPermohonanSKUSchema, TUpdatePermohonanSKUSchema } from "@/lib/validators/permohonan-sku";

const includeUser = {
  select: {
    userId: true,
    name: true,
    email: true,
    role: true,
  },
};

export const countPermohonanSKUService = async (where: Prisma.PermohonanSKUWhereInput) => {
  return prisma.permohonanSKU.count({ where });
};

export const findManyPermohonanSKUService = async (
  params: TFindManyPermohonanSKUSchema
) => {
  const skip = (params.page - 1) * params.limit;
  const take = params.limit;
  const orderBy = { [params.orderField]: params.orderDirection.toLowerCase() };
  const where: Prisma.PermohonanSKUWhereInput = {
    AND: [
      { statusPermohonan: params.status },
      { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
      { [params.searchBy]: { contains: params.searchValue, mode: "insensitive" } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.permohonanSKU.findMany({ 
      take, 
      skip, 
      orderBy, 
      where,
      include: {
        user: includeUser,
      },
    }),
    countPermohonanSKUService(where),
  ]);

  const totalPages = Math.ceil(total / take);
  const pagination = {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  };

  return { data, pagination };
};

export const findPermohonanSKUByIdService = async (id: string) => {
  return prisma.permohonanSKU.findUnique({
    where: { permohonanSKUId: id },
    include: {
      user: includeUser,
    },
  });
};

export const createPermohonanSKUService = async (
  userId: string,
  data: TCreatePermohonanSKUSchema,
) => {
  return prisma.permohonanSKU.create({
    data: {
      ...data,
      userId,
    },
    include: {
      user: includeUser,
    },
  });
};

export const updatePermohonanSKUService = async (
  id: string,
  data: TUpdatePermohonanSKUSchema,
) => {
  return prisma.permohonanSKU.update({
    where: { permohonanSKUId: id },
    data,
    include: {
      user: includeUser,
    },
  });
};

export const followUpPermohonanSKUService = async (
  id: string,
  statusPermohonan: StatusPermohonan,
  nomorPermohonan?: string,
  catatan?: string,
) => {
  return prisma.permohonanSKU.update({
    where: { permohonanSKUId: id },
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

export const deletePermohonanSKUService = async (id: string) => {
  return prisma.permohonanSKU.delete({ where: { permohonanSKUId: id } });
};
