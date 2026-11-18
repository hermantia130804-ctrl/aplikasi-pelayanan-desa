"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";

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

// ===== EXPORT EXCEL — format PERSIS sheet "LAPORAN BERDASARKAN USIA" =====
function buildExcelUsia(data: LampidUsiaData): string {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([[]]);

  const LAST_COL = "G"; // 7 cols: No, Kelompok Umur, L, P, Jml, Keterangan (6 data + 1 margin)
  const setCell = (ref: string, val: string | number) => {
    ws[ref] = { v: val, t: typeof val === "number" ? "n" : "s" };
  };
  const addMerge = (startRef: string, endRef: string) => {
    if (!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"]!.push({ s: XLSX.utils.decode_cell(startRef), e: XLSX.utils.decode_cell(endRef) });
  };

  // Headers
  setCell("A1", "PEMERINTAH KABUPATEN BOGOR"); addMerge("A1", `${LAST_COL}1`);
  setCell("A2", "KECAMATAN CIBUNGBULANG"); addMerge("A2", `${LAST_COL}2`);
  setCell("A3", "DESA SUKAMAJU"); addMerge("A3", `${LAST_COL}3`);
  setCell("A4", `Alamat : ${ALAMAT_DESA}`); addMerge("A4", `${LAST_COL}4`);
  setCell("A5", "LAPORAN PENDUDUK BERDASARKAN USIA"); addMerge("A5", `${LAST_COL}5`);
  setCell("A6", "DESA : SUKAMAJU"); addMerge("A6", `${LAST_COL}6`);
  setCell("A7", `BULAN : ${data.bulanLabel}`); addMerge("A7", `${LAST_COL}7`);
  setCell("A8", `TAHUN : ${data.tahun}`); addMerge("A8", `${LAST_COL}8`);

  // Table header row 9
  setCell("A9", "No.");
  setCell("B9", "Kelompok Umur");
  setCell("C9", "Laki-laki");
  setCell("D9", "Perempuan");
  setCell("E9", "Jumlah");
  setCell("F9", "Keterangan");

  // Data rows starting row 10
  let r = 10;
  for (const row of data.rows) {
    setCell(`A${r}`, row.no);
    setCell(`B${r}`, row.label);
    setCell(`C${r}`, row.lk);
    setCell(`D${r}`, row.pr);
    setCell(`E${r}`, row.jml);
    setCell(`F${r}`, row.keterangan);
    r++;
  }
  // Jumlah row
  setCell(`A${r}`, "Jumlah");
  setCell(`C${r}`, data.total.lk);
  setCell(`D${r}`, data.total.pr);
  setCell(`E${r}`, data.total.jml);

  // Signature
  setCell(`F${r + 2}`, `Sukamaju, ${data.tanggalCetak}`);
  setCell(`F${r + 3}`, "Kepala Desa Sukamaju");
  setCell(`F${r + 5}`, NAMA_KEPALA_DESA);

  ws["!cols"] = [
    { wch: 5 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 2 },
  ];
  ws["!ref"] = `A1:${LAST_COL}${r + 6}`;

  XLSX.utils.book_append_sheet(wb, ws, "Laporan Usia");
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" });
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
      const base64 = buildExcelUsia(data);
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
