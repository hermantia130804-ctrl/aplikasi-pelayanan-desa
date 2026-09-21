import { Prisma, StatusPermohonan } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { TCreatePermohonanPindahSchema, TFindManyPermohonanPindahSchema, TUpdatePermohonanPindahSchema } from "@/lib/validators/permohonan-pindah";

const includeUser = {
  select: {
    userId: true,
    name: true,
    email: true,
    role: true,
  },
};

const includeAnggotaKeluarga = {
  include: {
    permohonanPindahAnggota: {
      orderBy: {
        createdAt: "asc" as const,
      },
    },
  },
};

export const countPermohonanPindahService = async (where: Prisma.PermohonanPindahWhereInput) => {
  return prisma.permohonanPindah.count({ where });
};

export const findManyPermohonanPindahService = async (
  params: TFindManyPermohonanPindahSchema
) => {
  const skip = (params.page - 1) * params.limit;
  const take = params.limit;
  const orderBy = { [params.orderField]: params.orderDirection.toLowerCase() };
  const where: Prisma.PermohonanPindahWhereInput = {
    AND: [
      { statusPermohonan: params.status },
      { jenisPermohonanPindah: params.jenisPermohonanPindah },
      { createdAt: { gte: params.dateFrom, lte: params.dateTo } },
      { [params.searchBy]: { contains: params.searchValue, mode: "insensitive" } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.permohonanPindah.findMany({ 
      take, 
      skip, 
      orderBy, 
      where,
      include: {
        user: includeUser,
        ...includeAnggotaKeluarga,
      },
    }),
    countPermohonanPindahService(where),
  ]);

  const totalPages = Math.ceil(total / take);
  const pagination = {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
  };

  return { data, pagination };
};

export const findPermohonanPindahByIdService = async (id: string) => {
  return prisma.permohonanPindah.findUnique({
    where: { permohonanPindahId: id },
    include: {
      user: includeUser,
      ...includeAnggotaKeluarga,
    },
  });
};

export const createPermohonanPindahService = async (
  userId: string,
  data: TCreatePermohonanPindahSchema,
) => {
  const { anggotaKeluarga, ...permohonanData } = data;
  
  return prisma.permohonanPindah.create({
    data: {
      ...permohonanData,
      userId,
      permohonanPindahAnggota: {
        create: anggotaKeluarga,
      },
    },
    include: {
      user: includeUser,
      ...includeAnggotaKeluarga,
    },
  });
};

export const updatePermohonanPindahService = async (
  id: string,
  data: TUpdatePermohonanPindahSchema,
) => {
  const { anggotaKeluarga, ...permohonanData } = data;
  
  return prisma.$transaction(async (tx) => {
    // Update permohonan data
    await tx.permohonanPindah.update({
      where: { permohonanPindahId: id },
      data: permohonanData,
    });

    // Update anggota keluarga jika ada
    if (anggotaKeluarga && anggotaKeluarga.length > 0) {
      // Hapus anggota keluarga yang lama
      await tx.permohonanPindahAnggota.deleteMany({
        where: { permohonanPindahId: id },
      });

      // Tambah anggota keluarga yang baru
      await tx.permohonanPindahAnggota.createMany({
        data: anggotaKeluarga.map((anggota) => ({
          ...anggota,
          permohonanPindahId: id,
        })),
      });
    }

    // Return updated data dengan anggota keluarga terbaru
    return tx.permohonanPindah.findUnique({
      where: { permohonanPindahId: id },
      include: {
        user: includeUser,
        ...includeAnggotaKeluarga,
      },
    });
  });
};

export const followUpPermohonanPindahService = async (
  id: string,
  statusPermohonan: StatusPermohonan,
  nomorPermohonan?: string,
  catatan?: string,
) => {
  return prisma.permohonanPindah.update({
    where: { permohonanPindahId: id },
    data: {
      statusPermohonan,
      nomorPermohonan,
      catatan,
      updatedAt: new Date(),
    },
    include: {
      user: includeUser,
      ...includeAnggotaKeluarga,
    },
  });
};

export const deletePermohonanPindahService = async (id: string) => {
  return prisma.permohonanPindah.delete({ 
    where: { permohonanPindahId: id },
  });
};
