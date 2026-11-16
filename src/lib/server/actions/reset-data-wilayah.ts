"use server";

import status from "http-status";
import { ApiError } from "next/dist/server/api-utils";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { pendudukRTAction } from "./penduduk-rt";
import { sementaraRTAction } from "./penduduk-sementara-rt";
import { kejadianRTAction } from "./kejadian-rt";
import { sembakoRTAction } from "./sembako-rt";
import { suratPengantarRTAction } from "./surat-pengantar-rt";

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
 *  - filterRt/filterRw = "001"|"002" -> hapus hanya data RT.001/RW.002 (untuk
 *    tabel yang tidak punya kolom RT/RW seperti Kejadian & SuratPengantar, filter
 *    lewat lookup No. KK / NIK ke tabel DataWarga).
 *  - Konfirmasi wajib: payload.konfirmasi === "HAPUS".
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

    const { filterRt, filterRw } = payload;
    const hasil: HasilTab[] = [];

    // Eksekusi 5 deleteAll berurutan. Kalau salah satu gagal, tetap lanjutkan yang
    // lain supaya user dapat laporan lengkap; error per tab dilaporkan di response.
    // Cast signature ke (operation, payload?) -> Promise<unknown> supaya union
    // return type dari tiap action tidak menyusup ke deklarasi subActions.
    type ActionFn = (operation: string, payload?: unknown) => Promise<unknown>;
    const subActions: Array<[string, ActionFn]> = [
      ["Penduduk", pendudukRTAction as ActionFn],
      ["Sementara", sementaraRTAction as ActionFn],
      ["Kejadian", kejadianRTAction as ActionFn],
      ["Sembako", sembakoRTAction as ActionFn],
      ["Surat Pengantar", suratPengantarRTAction as ActionFn],
    ];

    for (const [nama, action] of subActions) {
      try {
        const r = (await action("deleteAll", { konfirmasi: "HAPUS", filterRt, filterRw })) as {
          status?: number;
          message?: string;
          jumlah?: number;
          error?: string;
        };
        hasil.push({
          tab: nama,
          pesan: r.message ?? (r.error ?? "OK"),
          jumlah: typeof r.jumlah === "number" ? r.jumlah : 0,
          status: r.status ?? 200,
          error: r.error,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        hasil.push({ tab: nama, pesan: msg, jumlah: 0, status: 500, error: msg });
      }
    }

    const total = hasil.reduce((a, b) => a + b.jumlah, 0);
    const adaError = hasil.some(h => h.status >= 400);

    return {
      status: status.OK,
      message: adaError
        ? `Reset selesai dengan sebagian error. Total ${total} record dihapus. Lihat detail per tab.`
        : `Reset data berhasil. Total ${total} record dihapus dari ${hasil.filter(h => h.jumlah > 0).length} tab.`,
      data: hasil,
      total,
    };
  } catch (error) {
    return errorHandler(error);
  }
};
