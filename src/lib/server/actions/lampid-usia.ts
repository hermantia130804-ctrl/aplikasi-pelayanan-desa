"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { LOGO_KAB_BOGOR_BASE64 } from "@/assets/logo-kab-bogor.base64";

const BULAN_NAMES = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
];

const NAMA_KEPALA_DESA = "Hj. CUCUM RATNA SUMINAR";
const ALAMAT_DESA = "Jl. KH. Abd. Hamid No.36 Cibungbulang Bogor – Kode pos (16630)";

// 15 kelompok umur sesuai sheet "LAPORAN BERDASARKAN USIA"
const AGE_GROUPS = [
  { no: 1, label: "00 - 04 tahun", min: 0, max: 4 },
  { no: 2, label: "05 - 09 tahun", min: 5, max: 9 },
  { no: 3, label: "10 - 14 tahun", min: 10, max: 14 },
  { no: 4, label: "15 - 19 tahun", min: 15, max: 19 },
  { no: 5, label: "20 - 24 tahun", min: 20, max: 24 },
  { no: 6, label: "25 - 29 tahun", min: 25, max: 29 },
  { no: 7, label: "30 - 34 tahun", min: 30, max: 34 },
  { no: 8, label: "35 - 39 tahun", min: 35, max: 39 },
  { no: 9, label: "40 - 44 tahun", min: 40, max: 44 },
  { no: 10, label: "45 - 49 tahun", min: 45, max: 49 },
  { no: 11, label: "50 - 54 tahun", min: 50, max: 54 },
  { no: 12, label: "55 - 59 tahun", min: 55, max: 59 },
  { no: 13, label: "60 - 64 tahun", min: 60, max: 64 },
  { no: 14, label: "65 - 69 tahun", min: 65, max: 69 },
  { no: 15, label: "70 tahun ke atas", min: 70, max: 200 },
];

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

interface UsiaRow {
  no: number;
  label: string;
  lk: number;
  pr: number;
  jml: number;
  keterangan: string; // persentase
}

interface LampidUsiaData {
  bulan: number;
  tahun: number;
  bulanLabel: string;
  tanggalCetak: string;
  rows: UsiaRow[];
  total: { lk: number; pr: number; jml: number };
}

function hitungUmurTahun(tanggalLahir: Date, refDate: Date): number {
  let umur = refDate.getFullYear() - tanggalLahir.getFullYear();
  const m = refDate.getMonth() - tanggalLahir.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < tanggalLahir.getDate())) umur--;
  return umur < 0 ? 0 : umur;
}

async function generateLampidUsiaData(bulan: number, tahun: number): Promise<LampidUsiaData> {
  // Tanggal referensi = hari terakhir bulan terpilih
  const refDate = new Date(tahun, bulan, 0, 23, 59, 59);

  const allWarga = await prisma.dataWarga.findMany();

  const buckets = AGE_GROUPS.map(g => ({ ...g, lk: 0, pr: 0, jml: 0 }));
  for (const w of allWarga) {
    const umur = hitungUmurTahun(w.tanggalLahir, refDate);
    const bucket = buckets.find(b => umur >= b.min && umur <= b.max);
    if (!bucket) continue;
    if (w.jenisKelamin === "LAKI-LAKI") bucket.lk++; else bucket.pr++;
    bucket.jml++;
  }
  const totalJml = buckets.reduce((a, b) => a + b.jml, 0);
  const totalLk = buckets.reduce((a, b) => a + b.lk, 0);
  const totalPr = buckets.reduce((a, b) => a + b.pr, 0);

  const rows: UsiaRow[] = buckets.map(b => ({
    no: b.no, label: b.label, lk: b.lk, pr: b.pr, jml: b.jml,
    keterangan: totalJml > 0 ? `${Math.round((b.jml / totalJml) * 100)}%` : "0%",
  }));

  const lastDay = new Date(tahun, bulan, 0).getDate();
  const tanggalCetak = `${lastDay} ${BULAN_NAMES[bulan - 1]} ${tahun}`;

  return {
    bulan, tahun, bulanLabel: BULAN_NAMES[bulan - 1],
    tanggalCetak, rows,
    total: { lk: totalLk, pr: totalPr, jml: totalJml },
  };
}

// ===== EXPORT EXCEL — format PERSIS sheet "LAPORAN BERDASARKAN USIA" (pakai exceljs) =====
async function buildExcelUsia(data: LampidUsiaData): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Laporan Usia", {
    views: [{ showGridLines: false }],
  });

  const COLOR_HEADER = "FF4472C4";
  const COLOR_HEADER_TEXT = "FFFFFFFF";
  const COLOR_TOTAL = "FFB4C7E7";
  const COLOR_BORDER = "FF000000";
  const thinBorder = {
    top: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    left: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    right: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    bottom: { style: "thin" as const, color: { argb: COLOR_BORDER } },
  };

  // Set lebar kolom individually (match Excel: col A kosong, B=No, C=Kelompok Umur, D-G=data)
  ws.getColumn(1).width = 3;   // A: margin (kosong di Excel)
  ws.getColumn(2).width = 5;   // B: No.
  ws.getColumn(3).width = 24;  // C: Kelompok Umur
  ws.getColumn(4).width = 14;  // D: Laki-laki
  ws.getColumn(5).width = 14;  // E: Perempuan
  ws.getColumn(6).width = 12;  // F: Jumlah
  ws.getColumn(7).width = 14;  // G: Keterangan

  const setCell = (row: number, col: number, val: string | number, opts?: {
    bold?: boolean; align?: "left" | "center" | "right"; fill?: string;
    fontColor?: string; border?: boolean; fontSize?: number;
  }) => {
    const cell = ws.getCell(row, col);
    cell.value = val;
    cell.alignment = { horizontal: opts?.align ?? "center", vertical: "middle" };
    cell.font = {
      bold: opts?.bold ?? false,
      color: { argb: opts?.fontColor ?? "FF000000" },
      size: opts?.fontSize ?? 10,
    };
    if (opts?.fill) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
    }
    if (opts?.border !== false) {
      cell.border = thinBorder;
    }
  };

  const merge = (r1: number, c1: number, r2: number, c2: number) => ws.mergeCells(r1, c1, r2, c2);

  // ===== HEADER (logo kiri + text rata kiri mulai col C=3) =====
  // Tambah logo ke workbook
  const logoBase64Data = LOGO_KAB_BOGOR_BASE64.split(",")[1];
  const imageId = wb.addImage({
    buffer: Buffer.from(logoBase64Data, "base64") as unknown as ArrayBuffer,
    extension: "png",
  });
  ws.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 70, height: 70 },
  });

  // Header text mulai col C=3 (logo di col A-B)
  merge(1, 3, 1, 6);
  setCell(1, 3, "PEMERINTAH KABUPATEN BOGOR", { bold: true, align: "left", border: false, fontSize: 11 });
  merge(2, 3, 2, 6);
  setCell(2, 3, "KECAMATAN CIBUNGBULANG", { bold: true, align: "left", border: false, fontSize: 11 });
  merge(3, 3, 3, 6);
  setCell(3, 3, "DESA SUKAMAJU", { bold: true, align: "left", border: false, fontSize: 11 });
  merge(4, 3, 4, 6);
  setCell(4, 3, `Alamat : ${ALAMAT_DESA}`, { align: "left", border: false, fontSize: 9 });
  merge(5, 3, 5, 6);
  setCell(5, 3, "LAPORAN PENDUDUK BERDASARKAN USIA", { bold: true, align: "left", border: false, fontSize: 11 });
  // DESA, BULAN, TAHUN di col B=2, rata kiri
  setCell(6, 2, "DESA : SUKAMAJU", { align: "left", border: false });
  setCell(7, 2, `BULAN : ${data.bulanLabel}`, { align: "left", border: false });
  setCell(8, 2, `TAHUN : ${data.tahun}`, { align: "left", border: false });

  // Table header row 9 — mulai col 2 (B) supaya col A kosong (match Excel sheet)
  const HDR = 9;
  setCell(HDR, 2, "No.", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HDR, 3, "Kelompok Umur", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT, align: "left" });
  setCell(HDR, 4, "Laki-laki", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HDR, 5, "Perempuan", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HDR, 6, "Jumlah", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HDR, 7, "Keterangan", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });

  // Data rows — mulai col 2 (B)
  let r = HDR + 1;
  for (const row of data.rows) {
    setCell(r, 2, row.no);
    setCell(r, 3, row.label, { align: "left" });
    setCell(r, 4, row.lk);
    setCell(r, 5, row.pr);
    setCell(r, 6, row.jml);
    setCell(r, 7, row.keterangan);
    r++;
  }
  // Jumlah row — merge cols 2-3 (B-C), data mulai col 4 (D)
  merge(r, 2, r, 3);
  setCell(r, 2, "Jumlah", { bold: true, fill: COLOR_TOTAL, align: "center" });
  setCell(r, 4, data.total.lk, { bold: true, fill: COLOR_TOTAL });
  setCell(r, 5, data.total.pr, { bold: true, fill: COLOR_TOTAL });
  setCell(r, 6, data.total.jml, { bold: true, fill: COLOR_TOTAL });
  setCell(r, 7, "100%", { bold: true, fill: COLOR_TOTAL });

  // Signature (merge cols 5-6 supaya text cukup lebar)
  merge(r + 2, 5, r + 2, 7);
  setCell(r + 2, 5, `Sukamaju, ${data.tanggalCetak}`, { align: "center", border: false });
  merge(r + 3, 5, r + 3, 7);
  setCell(r + 3, 5, "Kepala Desa Sukamaju", { align: "center", border: false });
  merge(r + 5, 5, r + 5, 7);
  setCell(r + 5, 5, NAMA_KEPALA_DESA, { align: "center", bold: true, border: false });

  // Row heights
  ws.getRow(HDR).height = 20;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

// ===== SERVER ACTION EXPORTS =====
export async function lampidUsiaAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff) throw new ApiError(status.FORBIDDEN, "Hanya Admin/Petugas yang dapat mengakses Kelola Lampid.");

    if (operation === "generate") {
      const { bulan, tahun } = (payload ?? {}) as { bulan?: number; tahun?: number };
      const now = new Date();
      const b = bulan ?? now.getMonth() + 1;
      const t = tahun ?? now.getFullYear();
      const data = await generateLampidUsiaData(b, t);
      return { status: 200, data };
    }

    if (operation === "save") {
      const { bulan, tahun, keterangan } = (payload ?? {}) as { bulan?: number; tahun?: number; keterangan?: string };
      const now = new Date();
      const b = bulan ?? now.getMonth() + 1;
      const t = tahun ?? now.getFullYear();
      const data = await generateLampidUsiaData(b, t);
      const saved = await prisma.laporanLampidUsia.upsert({
        where: { bulan_tahun: { bulan: b, tahun: t } },
        create: { bulan: b, tahun: t, data: JSON.stringify(data), keterangan: keterangan || null },
        update: { data: JSON.stringify(data), keterangan: keterangan || null },
      });
      revalidatePath("/kelola-lampid/usia");
      return { status: 200, id: saved.id, message: `Laporan Usia ${BULAN_NAMES[b - 1]} ${t} berhasil disimpan` };
    }

    if (operation === "listSaved") {
      const saved = await prisma.laporanLampidUsia.findMany({
        orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      });
      return {
        status: 200,
        data: saved.map(s => ({
          id: s.id, bulan: s.bulan, tahun: s.tahun,
          bulanLabel: BULAN_NAMES[s.bulan - 1],
          keterangan: s.keterangan || "",
          createdAt: s.createdAt.toISOString(),
        })),
      };
    }

    if (operation === "loadSaved") {
      const { id } = (payload ?? {}) as { id?: number };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID tidak valid");
      const saved = await prisma.laporanLampidUsia.findUnique({ where: { id } });
      if (!saved) throw new ApiError(status.NOT_FOUND, "Laporan tidak ditemukan");
      return { status: 200, data: JSON.parse(saved.data) as LampidUsiaData };
    }

    if (operation === "deleteSaved") {
      const { id } = (payload ?? {}) as { id?: number };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID tidak valid");
      await prisma.laporanLampidUsia.delete({ where: { id } });
      revalidatePath("/kelola-lampid/usia");
      return { status: 200, message: "Laporan berhasil dihapus" };
    }

    if (operation === "export") {
      const { bulan, tahun } = (payload ?? {}) as { bulan?: number; tahun?: number };
      const now = new Date();
      const b = bulan ?? now.getMonth() + 1;
      const t = tahun ?? now.getFullYear();
      const data = await generateLampidUsiaData(b, t);
      const base64 = await buildExcelUsia(data);
      return {
        status: 200,
        data: base64,
        filename: `Laporan_Lampid_Usia_${BULAN_NAMES[b - 1]}_${t}.xlsx`,
      };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (lampidUsia):", error);
    return { status: 500, error: "Terjadi kesalahan pada server" };
  }
}
