"use server";

import status from "http-status";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { ApiError } from "next/dist/server/api-utils";
import { z } from "zod";
import { MESSAGE } from "@/constants/message";
import { PILIHAN_DESIL } from "@/constants/desil";
import { prisma } from "@/lib/prisma";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";
import { kirimEmailStatusWarga } from "../services/permohonan-email-status";

// ===== Konstanta pilihan (konsisten form Google DTSEN) =====

const angkaNonNegatif = (label: string) =>
  z.coerce.number().min(0, `${label} tidak boleh negatif`);

const jsonOptional = z.string().optional();

// ===== Schema =====
const perbaikanDesilSchema = z.object({
  // 1. Identitas keluarga
  namaKk: z.string().min(3, "Nama Kepala Keluarga minimal 3 karakter"),
  nikKk: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  noKk: z.string().regex(/^\d{16}$/, "Nomor Kartu Keluarga harus 16 digit angka"),
  jumlahAnggota: z.coerce.number().int().min(1, "Jumlah anggota minimal 1"),
  alamat: z.string().min(5, "Alamat lengkap wajib diisi"),
  namaJalan: z.string().min(3, "Nama jalan wajib diisi"),
  noRumah: z.string().min(1, "Nomor rumah wajib diisi"),
  // 2. Sosial ekonomi (pilihan)
  jenisBangunan: z.enum(PILIHAN_DESIL.jenisBangunan),
  tinggalBersamaKeluargaLain: z.enum(["Ya", "Tidak"]),
  jumlahPenghuni: angkaNonNegatif("Jumlah penghuni").int().min(1, "Jumlah penghuni minimal 1"),
  statusKepemilikan: z.enum(PILIHAN_DESIL.statusKepemilikan),
  buktiTanah: z.enum(PILIHAN_DESIL.buktiTanah),
  hargaSewaBulan: angkaNonNegatif("Harga sewa"),
  luasLantai: angkaNonNegatif("Luas lantai"),
  jenisLantai: z.enum(PILIHAN_DESIL.jenisLantai),
  kondisiLantai: z.enum(PILIHAN_DESIL.kondisi),
  jenisDinding: z.enum(PILIHAN_DESIL.jenisDinding),
  kondisiDinding: z.enum(PILIHAN_DESIL.kondisi),
  jenisAtap: z.enum(PILIHAN_DESIL.jenisAtap),
  kondisiAtap: z.enum(PILIHAN_DESIL.kondisi),
  fasilitasBAB: z.enum(PILIHAN_DESIL.fasilitasBAB),
  jenisKloset: z.enum(PILIHAN_DESIL.jenisKloset),
  buanganTinja: jsonOptional,
  sumberAir: z.enum(PILIHAN_DESIL.sumberAir),
  sumberPenerangan: z.enum(PILIHAN_DESIL.sumberPenerangan),
  jumlahMeteran: z.coerce.number().int().min(0).max(9, "Jumlah meteran tidak wajar"),
  dayaListrik: z.enum(PILIHAN_DESIL.dayaListrik),
  idPelangganPln: z.string().min(1, "ID Pelanggan / No. Meteran PLN wajib diisi"),
  pengeluaranListrik: angkaNonNegatif("Pengeluaran listrik"),
  pengeluaranInternet: angkaNonNegatif("Pengeluaran internet"),
  pengeluaranMakananMingguan: angkaNonNegatif("Pengeluaran makanan mingguan"),
  pengeluaranBukanMakananBulanan: angkaNonNegatif("Pengeluaran bukan makanan bulanan"),
  pengeluaranBukanMakananTahunan: angkaNonNegatif("Pengeluaran bukan makanan tahunan").optional(),
  // 3. Aset
  asetGas3kg: angkaNonNegatif("Tabung gas 3 kg").int(),
  asetGas55kg: angkaNonNegatif("Tabung gas 5,5 kg").int(),
  asetKulkas: angkaNonNegatif("Kulkas").int(),
  asetAc: angkaNonNegatif("AC").int(),
  asetEmas: angkaNonNegatif("Emas/perhiasan").int(),
  asetKomputer: angkaNonNegatif("Komputer/laptop/tablet").int(),
  asetMotor: angkaNonNegatif("Sepeda motor").int(),
  asetMobil: angkaNonNegatif("Mobil").int(),
  asetRumahLain: z.enum(["Ya", "Tidak"]),
  asetLahanLain: angkaNonNegatif("Lahan lainnya").int(),
  fotoUrls: z.array(z.string().url()).min(1, "Minimal 1 foto rumah wajib diunggah").max(5, "Maksimal 5 foto"),
});

export type TPerbaikanDesilPayload = z.infer<typeof perbaikanDesilSchema>;

const requireSession = async () => {
  const session = await findCurrentSessionService();
  if (!session?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return session;
};

const requireStaff = async () => {
  const session = await requireSession();
  if (session.user.role !== "ADMIN" && session.user.role !== "PETUGAS") {
    throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat mengakses.");
  }
  return session;
};

// ===== Warga: buat pengajuan =====
export const createPerbaikanDesilAction = async (payload: unknown) => {
  try {
    const session = await requireSession();
    const parsed = perbaikanDesilSchema.parse(payload);

    const nomorPermohonan = await generateNomorPermohonan("DESIL");

    const data = await prisma.perbaikanDesil.create({
      data: {
        userId: session.user.userId,
        nomorPermohonan,
        namaKk: parsed.namaKk,
        nikKk: parsed.nikKk,
        noKk: parsed.noKk,
        jumlahAnggota: parsed.jumlahAnggota,
        alamat: parsed.alamat,
        namaJalan: parsed.namaJalan,
        noRumah: parsed.noRumah,
        jawaban: parsed as unknown as object,
        fotoUrls: parsed.fotoUrls as unknown as object,
      },
    });

    revalidatePath("/perbaikan-desil");
    revalidatePath("/kelola-perbaikan-desil");

    // Notifikasi Email + WA ke petugas (fire-and-forget, jangan gagalkan pengajuan)
    try {
      await notifikasiPetugasBaru("Perbaikan Desil", {
        nomor: nomorPermohonan,
        nama: parsed.namaKk,
        alasan: "Pemutakhiran data sosial-ekonomi (desil)",
        pengaju: session.user.name ?? "-",
      });
    } catch (e) {
      console.error("GAGAL NOTIF PETUGAS DESIL:", e);
    }

    return { status: status.OK, message: "Pengajuan perbaikan desil berhasil dikirim", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Petugas/Admin: daftar semua =====
export const findManyPerbaikanDesilAction = async () => {
  try {
    await requireStaff();
    const data = await prisma.perbaikanDesil.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Warga: daftar milik sendiri =====
export const findManyPerbaikanDesilByUserAction = async () => {
  try {
    const session = await requireSession();
    const data = await prisma.perbaikanDesil.findMany({
      where: { userId: session.user.userId },
      orderBy: { createdAt: "desc" },
    });
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Detail (pemilik / petugas / admin) =====
export const findPerbaikanDesilByIdAction = async (id: string) => {
  try {
    const session = await requireSession();
    const data = await prisma.perbaikanDesil.findUnique({
      where: { perbaikanDesilId: id },
      include: { user: true },
    });
    if (!data) throw new ApiError(status.NOT_FOUND, "Pengajuan tidak ditemukan.");
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff && data.userId !== session.user.userId) {
      throw new ApiError(status.FORBIDDEN, "Anda tidak berhak melihat pengajuan ini.");
    }
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Petugas/Admin: tindak lanjut =====
export const updateStatusPerbaikanDesilAction = async (id: string, payload: unknown) => {
  try {
    await requireStaff();
    const parsed = z
      .object({
        statusPermohonan: z.enum(["DIAJUKAN", "DISETUJUI", "DITOLAK"]),
        catatan: z.string().optional(),
      })
      .parse(payload);

    const data = await prisma.perbaikanDesil.update({
      where: { perbaikanDesilId: id },
      data: { statusPermohonan: parsed.statusPermohonan, catatan: parsed.catatan ?? null },
    });

    revalidatePath("/kelola-perbaikan-desil");
    revalidatePath("/perbaikan-desil");

    // Email status ke warga (fire-and-forget)
    try {
      await kirimEmailStatusWarga("DESIL", id);
    } catch (e) {
      console.error("GAGAL EMAIL STATUS DESIL:", e);
    }

    return { status: status.OK, message: "Status pengajuan berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Petugas/Admin: hapus pengajuan (DB + foto Blob ikut terhapus) =====
export const deletePerbaikanDesilAction = async (id: string) => {
  try {
    await requireStaff();

    const existing = await prisma.perbaikanDesil.findUnique({ where: { perbaikanDesilId: id } });
    if (!existing) throw new ApiError(status.NOT_FOUND, "Pengajuan tidak ditemukan.");

    const urls = (existing.fotoUrls as unknown as string[]) ?? [];
    for (const url of urls) {
      try { await del(url); } catch (e) { console.error("GAGAL HAPUS FOTO DESIL:", e); }
    }

    await prisma.perbaikanDesil.delete({ where: { perbaikanDesilId: id } });

    revalidatePath("/kelola-perbaikan-desil");
    revalidatePath("/perbaikan-desil");
    return { status: status.OK, message: "Pengajuan perbaikan desil berhasil dihapus" };
  } catch (error) {
    return errorHandler(error);
  }
};
