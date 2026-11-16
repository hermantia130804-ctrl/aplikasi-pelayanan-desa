"use server";

import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { prisma } from "@/lib/prisma";

interface ResetPayload {
  konfirmasi: string;
  filterRt?: string;
  filterRw?: string;
}

interface HasilTab {
  tab: string;
  pesan: string;
  jumlah: number;
  status: number;
  error?: string;
}

/**
 * Reset data wilayah: hapus SEMUA data di 5 tab sekaligus (Penduduk, Sementara,
 * Kejadian, Sembako, Surat Pengantar) sesuai filter RT/RW yang dipilih admin.
 *
 * PERILAKU:
 *  - Admin/Petugas only (server guard).
 *  - filterRt/filterRw = "SEMUA" atau undefined -> hapus SEMUA data di semua RT/RW.
 *  - filterRt/filterRw = "001"|"002" -> hapus hanya data RT.001/RW.002.
 *    Tab tanpa kolom RT/RW (Kejadian, SuratPengantar) di-filter lewat lookup
 *    No. KK / NIK ke DataWarga.
 *  - Konfirmasi wajib: payload.konfirmasi === "HAPUS".
 *
 * KEAMANAN (#6): 5 deleteMany dibungkus dalam satu prisma.$transaction.
 * Sebelumnya 5 delete dijalankan berurutan lewat sub-action terpisah — kalau
 * tab ke-3 gagal, tab 1-2 sudah terhapus → data loss parsial (state tidak
 * konsisten antar tab). Sekarang semua atau tidak sama sekali (atomic).
 *
 * Catatan lookup: kkSet (untuk Kejadian) dan nikSet (untuk SuratPengantar)
 * di-precompute SEBELUM transaksi karena bergantung pada data DataWarga yang
 * akan dihapus di dalam transaksi (transaksi melihat write-nya sendiri →
 * lookup di dalam transaksi setelah delete DataWarga akan kosong).
 *
 * RETURN: ringkasan per tab + total record dihapus.
 */
export const resetDataWilayahAction = async (payload: ResetPayload) => {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff) throw new ApiError(status.FORBIDDEN, "Hanya Admin/Petugas yang dapat melakukan reset data wilayah.");

    if (payload.konfirmasi !== "HAPUS") {
      throw new ApiError(status.BAD_REQUEST, "Ketik HAPUS untuk konfirmasi.");
    }

    const filterRt = payload.filterRt && payload.filterRt !== "SEMUA" ? String(payload.filterRt) : undefined;
    const filterRw = payload.filterRw && payload.filterRw !== "SEMUA" ? String(payload.filterRw) : undefined;

    // Where untuk model yang punya kolom noRt/noRw (DataWarga, PendudukSementara,
    // PenerimaSembako). {} = hapus semua; { noRt, noRw } = filter spesifik.
    const whereRT: Record<string, unknown> = {};
    if (filterRt) whereRT.noRt = filterRt;
    if (filterRw) whereRT.noRw = filterRw;

    // Precompute lookup sets SEBELUM transaksi (bergantung pada DataWarga &
    // PendudukSementara yang akan dihapus di dalam transaksi).
    // - kkSet: daftar No. KK di wilayah filter -> untuk filter Kejadian (noKk).
    // - nikSet: daftar NIK di wilayah filter -> untuk filter SuratPengantar (nik).
    let kkSet: string[] = [];
    let nikSet: string[] = [];
    if (filterRt || filterRw) {
      const [wargaKK, semKK, wargaNIK] = await Promise.all([
        prisma.dataWarga.findMany({ where: whereRT, select: { noKk: true }, distinct: ["noKk"] }),
        prisma.pendudukSementara.findMany({ where: whereRT, select: { noKk: true }, distinct: ["noKk"] }),
        prisma.dataWarga.findMany({ where: whereRT, select: { nik: true } }),
      ]);
      kkSet = Array.from(new Set([...wargaKK, ...semKK].map((x) => x.noKk).filter(Boolean))) as string[];
      nikSet = wargaNIK.map((x) => x.nik).filter(Boolean);
    }

    // Jalankan 5 deleteMany dalam SATU transaksi → atomic (#6).
    const txResult = await prisma.$transaction(async (tx) => {
      const whereKejadian = filterRt || filterRw ? { noKk: { in: kkSet } } : {};
      const whereSurat = filterRt || filterRw ? { nik: { in: nikSet } } : {};

      const [penduduk, sementara, kejadian, sembako, surat] = await Promise.all([
        tx.dataWarga.deleteMany({ where: whereRT }),
        tx.pendudukSementara.deleteMany({ where: whereRT }),
        tx.kejadian.deleteMany({ where: whereKejadian }),
        tx.penerimaSembako.deleteMany({ where: whereRT }),
        tx.suratPengantar.deleteMany({ where: whereSurat }),
      ]);
      return { penduduk, sementara, kejadian, sembako, surat };
    });

    // Bangun laporan per tab dari hasil transaksi.
    const hasil: HasilTab[] = [
      { tab: "Penduduk", pesan: `Data penduduk dihapus (${txResult.penduduk.count} warga)`, jumlah: txResult.penduduk.count, status: 200 },
      { tab: "Sementara", pesan: `Data penduduk sementara dihapus (${txResult.sementara.count} orang)`, jumlah: txResult.sementara.count, status: 200 },
      { tab: "Kejadian", pesan: `Data kejadian dihapus (${txResult.kejadian.count} catatan)`, jumlah: txResult.kejadian.count, status: 200 },
      { tab: "Sembako", pesan: `Data penerima sembako dihapus (${txResult.sembako.count} data)`, jumlah: txResult.sembako.count, status: 200 },
      { tab: "Surat Pengantar", pesan: `Data surat pengantar dihapus (${txResult.surat.count} surat)`, jumlah: txResult.surat.count, status: 200 },
    ];

    const total = hasil.reduce((a, b) => a + b.jumlah, 0);
    const adaError = hasil.some((h) => h.status >= 400);

    return {
      status: status.OK,
      message: adaError
        ? `Reset selesai dengan sebagian error. Total ${total} record dihapus. Lihat detail per tab.`
        : `Reset data berhasil. Total ${total} record dihapus dari ${hasil.filter((h) => h.jumlah > 0).length} tab.`,
      data: hasil,
      total,
    };
  } catch (error) {
    return errorHandler(error);
  }
};
