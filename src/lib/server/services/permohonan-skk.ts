import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { TCreatePermohonanSKKSchema, TFindManyPermohonanSKKSchema, TFollUpPermohonanSKKSchema, TUpdatePermohonanSKKSchema } from "@/lib/validators/permohonan-skk";


export const countPermohonanSKKService = async (where: Prisma.PermohonanSKKWhereInput) => {
  return prisma.permohonanSKK.count({ where });
};

export const findManyPermohonanSKKService = async (
  params: TFindManyPermohonanSKKSchema
) => {
  const skip = (params.page - 1) * params.limit;
  const take = params.limit;
  const orderBy = { [params.orderField]: params.orderDirection.toLowerCase() };
  const where: Prisma.PermohonanSKKWhereInput = {
    AND: [
      { statusPermohonan: params.status },
      { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
      { [params.searchBy]: { contains: params.searchValue, mode: "insensitive" } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.permohonanSKK.findMany({
      take,
      skip,
      orderBy,
      where,
      include: {
        user: { select: { userId: true, name: true, email: true, role: true } },
      },
    }),
    countPermohonanSKKService(where),
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

export const findPermohonanSKKByIdService = async (id: string) => {
  return prisma.permohonanSKK.findUnique({
    where: { permohonanSKKId: id },
    include: {
      user: { select: { userId: true, name: true, email: true, role: true } },
    },
  });
};

export const createPermohonanSKKService = async (
  userId: string,
  data: TCreatePermohonanSKKSchema,
) => {
  return prisma.permohonanSKK.create({
    data: {
      ...data,
      userId,
    },
    include: {
      user: { select: { userId: true, name: true, email: true, role: true } },
    },
  });
};

export const updatePermohonanSKKService = async (
  id: string,
  data: TUpdatePermohonanSKKSchema,
) => {
  return prisma.permohonanSKK.update({
    where: { permohonanSKKId: id },
    data,
    include: {
      user: { select: { userId: true, name: true, email: true, role: true } },
    },
  });
};

export const followUpPermohonanSKKService = async (id: string, data: Omit<TFollUpPermohonanSKKSchema, 'permohonanSKKId'>) => {
  return prisma.permohonanSKK.update({
    where: { permohonanSKKId: id },
    data,
    include: {
      user: { select: { userId: true, name: true, email: true, role: true } },
    },
  });
};

export const deletePermohonanSKKService = async (id: string) => {
  return prisma.permohonanSKK.delete({ where: { permohonanSKKId: id } });
};
