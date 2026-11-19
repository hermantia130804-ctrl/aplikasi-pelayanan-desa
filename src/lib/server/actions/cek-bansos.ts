"use server";

import status from "http-status";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { ApiError } from "next/dist/server/api-utils";
import { prisma } from "@/lib/prisma";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { generateNomorPermohonan } from "../services/nomor-permohonan";
import { notifikasiPetugasBaru } from "../services/notifikasi-petugas";
import { kirimEmailStatusWarga } from "../services/permohonan-email-status";
import { cekBansosSchema, cekBansosTindakLanjutSchema } from "@/lib/validators/cek-bansos";

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

// Warga/RT: ajukan cek status bansos
export const createCekBansosAction = async (payload: unknown) => {
  try {
    const session = await requireSession();
    if (session.user.role !== "USER" && session.user.role !== "RT") {
      throw new ApiError(status.FORBIDDEN, "Hanya masyarakat dan RT yang dapat mengajukan.");
    }
    const parsed = cekBansosSchema.parse(payload);
    const nomorPermohonan = await generateNomorPermohonan("BANSOS");

    const data = await prisma.cekBansos.create({
      data: {
        userId: session.user.userId,
        nomorPermohonan,
        namaKepalaKeluarga: parsed.namaKepalaKeluarga,
        noKk: parsed.noKk,
        nik: parsed.nik,
        fotoKkUrl: parsed.fotoKkUrl,
      },
    });

    revalidatePath("/cek-bansos");
    revalidatePath("/kelola-cek-bansos");

    try {
      await notifikasiPetugasBaru("Cek Status Bansos", {
        nomor: nomorPermohonan,
        nama: parsed.namaKepalaKeluarga,
        alasan: "Pengajuan cek kelayakan bansos",
        pengaju: session.user.name ?? "-",
      });
    } catch (e) {
      console.error("GAGAL NOTIF PETUGAS CEK BANSOS:", e);
    }

    return { status: status.OK, message: "Pengajuan cek status bansos berhasil dikirim", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// Petugas/Admin: daftar semua
export const findManyCekBansosAction = async () => {
  try {
    await requireStaff();
    const data = await prisma.cekBansos.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// Warga/RT: daftar milik sendiri
export const findManyCekBansosByUserAction = async () => {
  try {
    const session = await requireSession();
    const data = await prisma.cekBansos.findMany({
      where: { userId: session.user.userId },
      orderBy: { createdAt: "desc" },
    });
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// Detail (pemilik / petugas / admin)
export const findCekBansosByIdAction = async (id: string) => {
  try {
    const session = await requireSession();
    const data = await prisma.cekBansos.findUnique({
      where: { cekBansosId: id },
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

// Petugas/Admin: tindak lanjut (status + alasan/keterangan/fotoHasil)
export const updateStatusCekBansosAction = async (id: string, payload: unknown) => {
  try {
    const session = await requireStaff();
    const parsed = cekBansosTindakLanjutSchema.parse(payload);

    const data = await prisma.cekBansos.update({
      where: { cekBansosId: id },
      data: {
        statusPermohonan: parsed.statusPermohonan,
        alasanDitolak: parsed.statusPermohonan === "DITOLAK" ? (parsed.alasanDitolak ?? null) : null,
        keteranganSelesai: parsed.statusPermohonan === "SELESAI" ? (parsed.keteranganSelesai ?? null) : null,
        fotoHasilUrl: parsed.statusPermohonan === "SELESAI" ? (parsed.fotoHasilUrl ?? null) : null,
        petugasId: session.user.userId,
      },
    });

    revalidatePath("/kelola-cek-bansos");
    revalidatePath("/cek-bansos");

    try {
      await kirimEmailStatusWarga("BANSOS", id);
    } catch (e) {
      console.error("GAGAL EMAIL STATUS CEK BANSOS:", e);
    }

    return { status: status.OK, message: "Status pengajuan berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// Petugas/Admin: hapus (DB + foto Blob)
export const deleteCekBansosAction = async (id: string) => {
  try {
    await requireStaff();
    const existing = await prisma.cekBansos.findUnique({ where: { cekBansosId: id } });
    if (!existing) throw new ApiError(status.NOT_FOUND, "Pengajuan tidak ditemukan.");

    const urls = [existing.fotoKkUrl, existing.fotoHasilUrl].filter((u): u is string => !!u);
    for (const url of urls) {
      try {
        await del(url);
      } catch (e) {
        console.error("GAGAL HAPUS FOTO CEK BANSOS:", e);
      }
    }

    await prisma.cekBansos.delete({ where: { cekBansosId: id } });
    revalidatePath("/kelola-cek-bansos");
    revalidatePath("/cek-bansos");
    return { status: status.OK, message: "Pengajuan cek status bansos berhasil dihapus" };
  } catch (error) {
    return errorHandler(error);
  }
};
