import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { TCreatePermohonanKTPSchema, TFindManyPermohonanKTPSchema, TFollowUpPermohonanKTPSchema, TUpdatePermohonanKTPSchema } from "@/lib/validators/permohonan-ktp";


export const countPermohonanKTPService = async (where: Prisma.PermohonanKTPWhereInput) => {
  return prisma.permohonanKTP.count({ where });
};

export const findManyPermohonanKTPService = async (
  params: TFindManyPermohonanKTPSchema
) => {
  const skip = (params.page - 1) * params.limit;
  const take = params.limit;
  const orderBy = { [params.orderBy]: params.orderDirection.toLowerCase() };
  const where: Prisma.PermohonanKTPWhereInput = {
    AND: [
      { jenisPermohonanKTP: params.jenis },
      { statusPermohonan: params.status },
      { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
      { [params.searchBy]: { contains: params.searchValue, mode: "insensitive" } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.permohonanKTP.findMany({ take, skip, where, orderBy }),
    countPermohonanKTPService(where),
  ]);

  const pagination = {
    totalItems: total,
    currentPage: params.page,
    totalPages: Math.ceil(total / params.limit),
  };

  return { data, pagination };
};

export const findPermohonanKTPByIdService = async (id: string) => {
  return prisma.permohonanKTP.findUnique({
    where: { permohonanKtpId: id },
    include: { user: true },
  });
};

export const createPermohonanKTPService = async (
  userId: string,
  data: TCreatePermohonanKTPSchema,
) => {
  return prisma.permohonanKTP.create({ data: { ...data, userId } });
};

export const updatePermohonanKTPService = async (
  id: string,
  data: TUpdatePermohonanKTPSchema,
) => {
  return prisma.permohonanKTP.update({ where: { permohonanKtpId: id }, data });
};


export const deletePermohonanKTPService = async (id: string) => {
  return prisma.permohonanKTP.delete({ where: { permohonanKtpId: id } });
};

export const followUpPermohonanKTPService = async (id: string, data: Omit<TFollowUpPermohonanKTPSchema, 'permohonanKtpId'>) => {
  return prisma.permohonanKTP.update({ where: { permohonanKtpId: id }, data });
};

export const updateStatusPermohonanKTPService = async (id: string, data: { statusPermohonan: "DIAJUKAN" | "DISETUJUI" | "DITOLAK" }) => {
  return prisma.permohonanKTP.update({ where: { permohonanKtpId: id }, data });
};

export const findManyPermohonanKTPByUserService = async (userId: string) => {
  return prisma.permohonanKTP.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};
