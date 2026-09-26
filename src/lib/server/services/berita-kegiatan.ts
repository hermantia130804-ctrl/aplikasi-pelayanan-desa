import { prisma } from "@/lib/prisma";

export const findManyBeritaService = async () => {
  return prisma.beritaKegiatan.findMany({ orderBy: { tanggalKegiatan: "desc" }, include: { penulis: true } });
};

export const findBeritaByIdService = async (id: string) => {
  return prisma.beritaKegiatan.findUnique({ where: { beritaId: id }, include: { penulis: true } });
};

export const createBeritaService = async (
  penulisId: string,
  data: { judul: string; slug: string; isi: string; kategoriMedia: "GAMBAR" | "YOUTUBE"; gambarUrl?: string | null; youtubeId?: string | null; tanggalKegiatan: Date }
) => {
  return prisma.beritaKegiatan.create({ data: { ...data, penulisId } });
};

export const updateBeritaService = async (id: string, data: { judul?: string; slug?: string; isi?: string; kategoriMedia?: "GAMBAR" | "YOUTUBE"; gambarUrl?: string | null; youtubeId?: string | null; tanggalKegiatan?: Date }) => {
  return prisma.beritaKegiatan.update({ where: { beritaId: id }, data });
};

export const deleteBeritaService = async (id: string) => {
  return prisma.beritaKegiatan.delete({ where: { beritaId: id } });
};

export const buatSlug = (judul: string, kegiatanTanggal: Date) => {
  const d = kegiatanTanggal;
  const tgl = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const judulSingkat = judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const random = Math.random().toString(36).slice(2, 6);
  return `kegiatan-${tgl}-${judulSingkat}-${random}`;
};