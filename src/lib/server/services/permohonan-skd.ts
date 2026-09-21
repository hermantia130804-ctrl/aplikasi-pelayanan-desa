import { StatusPermohonan } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { CreatePermohonanSKDInput, FindManyPermohonanSKDInput, UpdatePermohonanSKDInput } from "@/lib/validators/permohonan-skd";

export async function createPermohonanSKDService(userId: string, data: CreatePermohonanSKDInput) {
  return await prisma.permohonanSKD.create({
    data: {
      ...data,
      userId,
    },
    include: {
      user: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function findManyPermohonanSKDService(params: FindManyPermohonanSKDInput) {
  const { page, limit, searchValue, searchBy, status, orderField, orderDirection } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { statusPermohonan: status }),
    ...(searchValue && {
      [searchBy]: {
        contains: searchValue,
        mode: "insensitive" as const,
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.permohonanSKD.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [orderField]: orderDirection,
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.permohonanSKD.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findPermohonanSKDService(permohonanSKDId: string) {
  return await prisma.permohonanSKD.findUnique({
    where: { permohonanSKDId },
    include: {
      user: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updatePermohonanSKDService(permohonanSKDId: string, data: UpdatePermohonanSKDInput) {
  return await prisma.permohonanSKD.update({
    where: { permohonanSKDId },
    data,
    include: {
      user: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function deletePermohonanSKDService(permohonanSKDId: string) {
  return await prisma.permohonanSKD.delete({
    where: { permohonanSKDId },
  });
}

export async function followUpPermohonanSKDService(
  permohonanSKDId: string,
  statusPermohonan: StatusPermohonan,
  nomorPermohonan?: string,
  catatan?: string
) {
  return await prisma.permohonanSKD.update({
    where: { permohonanSKDId },
    data: {
      statusPermohonan,
      ...(nomorPermohonan && { nomorPermohonan }),
      ...(catatan && { catatan }),
    },
    include: {
      user: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });
}
