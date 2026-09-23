import { prisma } from "@/lib/prisma";

export const findPermohonanSaya = async (userId: string) => {
  const [ktp, skl, sktm, skk, sku, skd, pindah] = await Promise.all([
    prisma.permohonanKTP.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.permohonanSKL.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.permohonanSKTM.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.permohonanSKK.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.permohonanSKU.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.permohonanSKD.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.permohonanPindah.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);
  return { ktp, skl, sktm, skk, sku, skd, pindah };
};
