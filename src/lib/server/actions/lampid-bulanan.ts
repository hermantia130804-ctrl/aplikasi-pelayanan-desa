"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";

const BULAN_NAMES = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
];

const NAMA_KEPALA_DESA = "Hj. CUCUM RATNA SUMINAR";
const ALAMAT_DESA = "Jl. KH. Abd. Hamid No.36 Cibungbulang Bogor – Kode pos (16630)";

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

// Tipe data baris laporan
interface RowData {
  rw: string;
  rt: string;
  isSubtotal: boolean;
  isGrandTotal: boolean;
  jmlPddkBlnLalu: { lk: number; pr: number; jml: number };
  lahir: { lk: number; pr: number; jml: number };
  mati: { lk: number; pr: number; jml: number };
  datang: { lk: number; pr: number; jml: number };
  pindah: { lk: number; pr: number; jml: number };
  jmlPddkBlnIni: { lk: number; pr: number; jml: number };
  kk: { wajib: number; memiliki: number; belum: number };
  ktp: { wajib: number; memiliki: number; belum: number };
}

interface AgamaRow {
  label: string;
  lk: number;
  pr: number;
  jml: number;
}

interface LampidBulananData {
  bulan: number;
  tahun: number;
  bulanLabel: string;
  tanggalCetak: string;
  rows: RowData[];
  agamaRows: AgamaRow[];
  agamaTotal: { lk: number; pr: number; jml: number };
}

// Hitung umur pada tanggal referensi
function hitungUmurTahun(tanggalLahir: Date, refDate: Date): number {
  let umur = refDate.getFullYear() - tanggalLahir.getFullYear();
  const m = refDate.getMonth() - tanggalLahir.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < tanggalLahir.getDate())) umur--;
  return umur < 0 ? 0 : umur;
}

// Generate data laporan bulanan dari DB
async function generateLampidBulananData(bulan: number, tahun: number): Promise<LampidBulananData> {
  // Periode bulan terpilih
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);
  const refDate = new Date(tahun, bulan - 1, 15); // tengah bulan untuk hitung umur

  // Fetch semua DataWarga (akumulasi semua RT)
  const allWarga = await prisma.dataWarga.findMany();
  const allKejadian = await prisma.kejadian.findMany({
    where: { tanggal: { gte: startDate, lte: endDate } },
  });

  // Build map noKk -> (noRt, noRw) untuk atribusi kejadian ke RT
  const kkToRtMap = new Map<string, { noRt: string; noRw: string }>();
  for (const w of allWarga) {
    if (w.noKk && w.noRt && w.noRw) {
      kkToRtMap.set(w.noKk, { noRt: w.noRt, noRw: w.noRw });
    }
  }

  // Dapatkan daftar unik (noRt, noRw)
  const rtSet = new Set<string>();
  for (const w of allWarga) {
    if (w.noRt && w.noRw) rtSet.add(`${w.noRt}|${w.noRw}`);
  }
  const rtList = Array.from(rtSet).map(s => {
    const [noRt, noRw] = s.split("|");
    return { noRt, noRw };
  }).sort((a, b) => a.noRw.localeCompare(b.noRw) || a.noRt.localeCompare(b.noRt));

  // Untuk tiap RT, hitung metrik
  const rows: RowData[] = [];
  // Subtotal per RW
  const rwSubtotals = new Map<string, RowData>();

  for (const { noRt, noRw } of rtList) {
    const wargaRT = allWarga.filter(w => w.noRt === noRt && w.noRw === noRw);

    // KK milik RT ini (untuk lookup kejadian)
    const kkSetRT = new Set(wargaRT.map(w => w.noKk).filter(Boolean));

    // Kejadian bulan ini untuk RT ini (via KK match)
    const kejadianRT = allKejadian.filter(k => k.noKk && kkSetRT.has(k.noKk));

    const lahir = { lk: 0, pr: 0, jml: 0 };
    const mati = { lk: 0, pr: 0, jml: 0 };
    const datang = { lk: 0, pr: 0, jml: 0 };
    const pindah = { lk: 0, pr: 0, jml: 0 };

    for (const k of kejadianRT) {
      const isL = (k.jenisKelamin || "").toUpperCase() === "LAKI-LAKI";
      const target = k.jenisKejadian === "LAHIR" ? lahir
        : k.jenisKejadian === "MATI" ? mati
        : k.jenisKejadian === "DATANG" ? datang
        : k.jenisKejadian === "PINDAH" ? pindah
        : null;
      if (!target) continue;
      if (isL) target.lk++; else target.pr++;
      target.jml++;
    }

    // Jml Pddk Bln Ini = current snapshot RT ini
    const jmlPddkBlnIni = {
      lk: wargaRT.filter(w => w.jenisKelamin === "LAKI-LAKI").length,
      pr: wargaRT.filter(w => w.jenisKelamin !== "LAKI-LAKI").length,
      jml: wargaRT.length,
    };
    // Jml Pddk Bln Lalu = bulan ini - LAHIR + MATI - DATANG + PINDAH
    const jmlPddkBlnLalu = {
      lk: jmlPddkBlnIni.lk - lahir.lk + mati.lk - datang.lk + pindah.lk,
      pr: jmlPddkBlnIni.pr - lahir.pr + mati.pr - datang.pr + pindah.pr,
      jml: jmlPddkBlnIni.jml - lahir.jml + mati.jml - datang.jml + pindah.jml,
    };

    // KK: Wajib = count KEPALA KELUARGA; Memiliki = asumsi semua KK punya (since noKk terdaftar); Belum = 0
    const kkWajib = wargaRT.filter(w => w.statusKeluarga === "KEPALA KELUARGA").length;
    const kk = { wajib: kkWajib, memiliki: kkWajib, belum: 0 };

    // KTP: Wajib = umur >= 17; Memiliki = punyaKtp="PUNYA"; Belum = wajib - memiliki
    const wajibKTP = wargaRT.filter(w => hitungUmurTahun(w.tanggalLahir, refDate) >= 17).length;
    const punyaKTP = wargaRT.filter(w => w.punyaKtp === "PUNYA").length;
    const ktp = { wajib: wajibKTP, memiliki: punyaKTP, belum: Math.max(0, wajibKTP - punyaKTP) };

    const row: RowData = {
      rw: noRw, rt: noRt, isSubtotal: false, isGrandTotal: false,
      jmlPddkBlnLalu, lahir, mati, datang, pindah, jmlPddkBlnIni, kk, ktp,
    };
    rows.push(row);

    // Akumulasi subtotal per RW
    const subKey = noRw;
    if (!rwSubtotals.has(subKey)) {
      rwSubtotals.set(subKey, {
        rw: noRw, rt: "", isSubtotal: true, isGrandTotal: false,
        jmlPddkBlnLalu: { lk: 0, pr: 0, jml: 0 },
        lahir: { lk: 0, pr: 0, jml: 0 },
        mati: { lk: 0, pr: 0, jml: 0 },
        datang: { lk: 0, pr: 0, jml: 0 },
        pindah: { lk: 0, pr: 0, jml: 0 },
        jmlPddkBlnIni: { lk: 0, pr: 0, jml: 0 },
        kk: { wajib: 0, memiliki: 0, belum: 0 },
        ktp: { wajib: 0, memiliki: 0, belum: 0 },
      });
    }
    const sub = rwSubtotals.get(subKey)!;
    (["jmlPddkBlnLalu", "lahir", "mati", "datang", "pindah", "jmlPddkBlnIni"] as const).forEach(k => {
      sub[k].lk += row[k].lk; sub[k].pr += row[k].pr; sub[k].jml += row[k].jml;
    });
    sub.kk.wajib += row.kk.wajib; sub.kk.memiliki += row.kk.memiliki; sub.kk.belum += row.kk.belum;
    sub.ktp.wajib += row.ktp.wajib; sub.ktp.memiliki += row.ktp.memiliki; sub.ktp.belum += row.ktp.belum;
  }

  // Sisipkan baris "Jumlah" per RW setelah RT terakhir RW itu
  const rowsWithSubtotals: RowData[] = [];
  let lastRw = "";
  for (const row of rows) {
    if (lastRw && row.rw !== lastRw && rwSubtotals.has(lastRw)) {
      rowsWithSubtotals.push(rwSubtotals.get(lastRw)!);
    }
    rowsWithSubtotals.push(row);
    lastRw = row.rw;
  }
  if (lastRw && rwSubtotals.has(lastRw)) {
    rowsWithSubtotals.push(rwSubtotals.get(lastRw)!);
  }

  // Grand total
  const grand: RowData = {
    rw: "", rt: "", isSubtotal: false, isGrandTotal: true,
    jmlPddkBlnLalu: { lk: 0, pr: 0, jml: 0 },
    lahir: { lk: 0, pr: 0, jml: 0 },
    mati: { lk: 0, pr: 0, jml: 0 },
    datang: { lk: 0, pr: 0, jml: 0 },
    pindah: { lk: 0, pr: 0, jml: 0 },
    jmlPddkBlnIni: { lk: 0, pr: 0, jml: 0 },
    kk: { wajib: 0, memiliki: 0, belum: 0 },
    ktp: { wajib: 0, memiliki: 0, belum: 0 },
  };
  for (const r of rowsWithSubtotals) {
    if (r.isGrandTotal) continue;
    (["jmlPddkBlnLalu", "lahir", "mati", "datang", "pindah", "jmlPddkBlnIni"] as const).forEach(k => {
      grand[k].lk += r[k].lk; grand[k].pr += r[k].pr; grand[k].jml += r[k].jml;
    });
    grand.kk.wajib += r.kk.wajib; grand.kk.memiliki += r.kk.memiliki; grand.kk.belum += r.kk.belum;
    grand.ktp.wajib += r.ktp.wajib; grand.ktp.memiliki += r.ktp.memiliki; grand.ktp.belum += r.ktp.belum;
  }
  grand.rw = ""; grand.rt = "";
  rowsWithSubtotals.push(grand);

  // Penganut agama: groupBy agama dari semua warga
  const agamaMap = new Map<string, { lk: number; pr: number; jml: number }>();
  for (const w of allWarga) {
    const agama = (w.agama || "LAINNYA").toUpperCase();
    if (!agamaMap.has(agama)) agamaMap.set(agama, { lk: 0, pr: 0, jml: 0 });
    const a = agamaMap.get(agama)!;
    if (w.jenisKelamin === "LAKI-LAKI") a.lk++; else a.pr++;
    a.jml++;
  }
  const agamaRows: AgamaRow[] = Array.from(agamaMap.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.jml - a.jml);
  const agamaTotal = agamaRows.reduce((acc, r) => ({
    lk: acc.lk + r.lk, pr: acc.pr + r.pr, jml: acc.jml + r.jml,
  }), { lk: 0, pr: 0, jml: 0 });

  // Tanggal cetak = hari terakhir bulan terpilih
  const lastDay = new Date(tahun, bulan, 0).getDate();
  const tanggalCetak = `${lastDay} ${BULAN_NAMES[bulan - 1]} ${tahun}`;

  return {
    bulan, tahun, bulanLabel: BULAN_NAMES[bulan - 1],
    tanggalCetak, rows: rowsWithSubtotals, agamaRows, agamaTotal,
  };
}

// ===== EXPORT EXCEL — format PERSIS sheet JULI 2026 (pakai exceljs untuk styling) =====
async function buildExcelBulanan(data: LampidBulananData): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Laporan Penduduk", {
    views: [{ showGridLines: false }],
  });

  // Definisi warna
  const COLOR_HEADER = "FF4472C4";      // biru header
  const COLOR_HEADER_TEXT = "FFFFFFFF"; // putih
  const COLOR_SUBTOTAL = "FFD6E4F0";    // biru muda subtotal
  const COLOR_GRANDTOTAL = "FFB4C7E7";  // biru medium grand total
  const COLOR_AGAMA_HEADER = "FFFFF2CC"; // kuning muda
  const COLOR_BORDER = "FF000000";      // hitam
  const thinBorder = {
    top: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    left: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    right: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    bottom: { style: "thin" as const, color: { argb: COLOR_BORDER } },
  };

  // Set lebar kolom: A=RW(6), B=RT(8), C-Z=7 each
  ws.columns = [
    { width: 6, key: "A" },   // RW
    { width: 8, key: "B" },   // RT
    ...Array(24).fill(0).map(() => ({ width: 7 })), // C-Z (24 cols)
  ];

  // Helper: set cell value + style
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
      size: opts?.fontSize ?? 9,
    };
    if (opts?.fill) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
    }
    if (opts?.border !== false) {
      cell.border = thinBorder;
    }
  };

  // Merge helper
  const merge = (r1: number, c1: number, r2: number, c2: number) => {
    ws.mergeCells(r1, c1, r2, c2);
  };

  // ===== HEADER (kop dihapus, hanya LAPORAN PENDUDUK rata kiri) =====
  // Row 1: LAPORAN PENDUDUK (left-aligned, bold)
  merge(1, 1, 1, 5);
  setCell(1, 1, "LAPORAN PENDUDUK", { bold: true, align: "left", fontSize: 12, border: false });
  // Row 2: BULAN
  merge(2, 1, 2, 5);
  setCell(2, 1, `BULAN : ${data.bulanLabel}`, { align: "left", border: false });
  // Row 3: TAHUN
  merge(3, 1, 3, 5);
  setCell(3, 1, `TAHUN : ${data.tahun}`, { align: "left", border: false });

  // Row 5-6: Table header (2 rows)
  const HEADER_ROW1 = 5;
  const HEADER_ROW2 = 6;

  // Header row 1: group names (merged vertically with row 2 for RW & RT)
  setCell(HEADER_ROW1, 1, "RW", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  merge(HEADER_ROW1, 1, HEADER_ROW2, 1);
  setCell(HEADER_ROW1, 2, "RT", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  merge(HEADER_ROW1, 2, HEADER_ROW2, 2);

  // 6 groups x 3 cols (C-T): Jml Pddk Bln Lalu, Lahir, Mati, Datang, Pindah, Jml.Pddk Bln ini
  const groupNames = ["Jml Pddk Bln Lalu", "Lahir", "Mati", "Datang", "Pindah", "Jml.Pddk Bln ini"];
  let col = 3;
  for (const name of groupNames) {
    merge(HEADER_ROW1, col, HEADER_ROW1, col + 2);
    setCell(HEADER_ROW1, col, name, { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    // Sub-headers di row 2
    setCell(HEADER_ROW2, col, "Lk", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    setCell(HEADER_ROW2, col + 1, "Pr", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    setCell(HEADER_ROW2, col + 2, "Jml", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    col += 3;
  }

  // KK (U-W): Wajib, Memiliki, Belum
  merge(HEADER_ROW1, col, HEADER_ROW1, col + 2);
  setCell(HEADER_ROW1, col, "Kartu Keluarga", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col, "Wajib", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 1, "Memiliki", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 2, "Belum", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  col += 3;

  // KTP (X-Z): Wajib, Memiliki, Belum
  merge(HEADER_ROW1, col, HEADER_ROW1, col + 2);
  setCell(HEADER_ROW1, col, "Kartu Tanda Penduduk", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col, "Wajib", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 1, "Memiliki", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 2, "Belum", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });

  // ===== DATA ROWS =====
  let rowIdx = HEADER_ROW2 + 1; // row 7
  for (const row of data.rows) {
    const fill = row.isGrandTotal ? COLOR_GRANDTOTAL : row.isSubtotal ? COLOR_SUBTOTAL : undefined;
    const bold = row.isGrandTotal || row.isSubtotal;
    const rtLabel = row.isGrandTotal ? "Jml.Ttl" : row.isSubtotal ? "Jumlah" : row.rt;

    setCell(rowIdx, 1, row.rw, { bold, fill });
    setCell(rowIdx, 2, rtLabel, { bold, fill });

    const groups = [row.jmlPddkBlnLalu, row.lahir, row.mati, row.datang, row.pindah, row.jmlPddkBlnIni];
    let c = 3;
    for (const g of groups) {
      setCell(rowIdx, c, g.lk, { bold, fill });
      setCell(rowIdx, c + 1, g.pr, { bold, fill });
      setCell(rowIdx, c + 2, g.jml, { bold, fill });
      c += 3;
    }
    setCell(rowIdx, c, row.kk.wajib, { bold, fill });
    setCell(rowIdx, c + 1, row.kk.memiliki, { bold, fill });
    setCell(rowIdx, c + 2, row.kk.belum, { bold, fill });
    c += 3;
    setCell(rowIdx, c, row.ktp.wajib, { bold, fill });
    setCell(rowIdx, c + 1, row.ktp.memiliki, { bold, fill });
    setCell(rowIdx, c + 2, row.ktp.belum, { bold, fill });
    rowIdx++;
  }

  // ===== SIGNATURE (right side, col U=21) =====
  const sigRow = rowIdx + 1;
  setCell(sigRow, 21, `SUKAMAJU, ${data.tanggalCetak}`, { align: "center", border: false });
  setCell(sigRow + 1, 21, "KEPALA DESA SUKAMAJU", { align: "center", border: false });
  setCell(sigRow + 3, 21, NAMA_KEPALA_DESA, { align: "center", bold: true, border: false });

  // ===== PENGANUT GOLONGAN AGAMA (left side) =====
  const agRow = sigRow;
  merge(agRow, 3, agRow, 5);
  setCell(agRow, 3, "PENGANUT GOLONGAN AGAMA", { bold: true, fill: COLOR_AGAMA_HEADER, align: "left" });

  const agamaToShow = data.agamaRows.slice(0, 4);
  const agamaHeader = [...agamaToShow.map(a => a.label), "JUMLAH"];
  let agCol = 3;
  // Header row
  for (let i = 0; i < agamaHeader.length; i++) {
    merge(agRow + 1, agCol, agRow + 1, agCol + 2);
    setCell(agRow + 1, agCol, agamaHeader[i], { bold: true, fill: COLOR_AGAMA_HEADER });
    setCell(agRow + 2, agCol, "L", { bold: true, fill: COLOR_AGAMA_HEADER });
    setCell(agRow + 2, agCol + 1, "P", { bold: true, fill: COLOR_AGAMA_HEADER });
    setCell(agRow + 2, agCol + 2, "JML", { bold: true, fill: COLOR_AGAMA_HEADER });
    agCol += 3;
  }
  // Data row
  agCol = 3;
  for (let i = 0; i < agamaToShow.length; i++) {
    const a = agamaToShow[i];
    setCell(agRow + 3, agCol, a.lk);
    setCell(agRow + 3, agCol + 1, a.pr);
    setCell(agRow + 3, agCol + 2, a.jml);
    agCol += 3;
  }
  // JUMLAH total
  setCell(agRow + 3, agCol, data.agamaTotal.lk, { bold: true });
  setCell(agRow + 3, agCol + 1, data.agamaTotal.pr, { bold: true });
  setCell(agRow + 3, agCol + 2, data.agamaTotal.jml, { bold: true });

  // Set row heights for header
  ws.getRow(HEADER_ROW1).height = 20;
  ws.getRow(HEADER_ROW2).height = 18;

  // Write to base64
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

// ===== SERVER ACTION EXPORTS =====
export async function lampidBulananAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    if (!isStaff) throw new ApiError(status.FORBIDDEN, "Hanya Admin/Petugas yang dapat mengakses Kelola Lampid.");

    if (operation === "generate") {
      const { bulan, tahun } = (payload ?? {}) as { bulan?: number; tahun?: number };
      const now = new Date();
      const b = bulan ?? now.getMonth() + 1;
      const t = tahun ?? now.getFullYear();
      const data = await generateLampidBulananData(b, t);
      return { status: 200, data };
    }

    if (operation === "save") {
      const { bulan, tahun, keterangan } = (payload ?? {}) as { bulan?: number; tahun?: number; keterangan?: string };
      const now = new Date();
      const b = bulan ?? now.getMonth() + 1;
      const t = tahun ?? now.getFullYear();
      const data = await generateLampidBulananData(b, t);
      const saved = await prisma.laporanLampidBulanan.upsert({
        where: { bulan_tahun: { bulan: b, tahun: t } },
        create: { bulan: b, tahun: t, data: JSON.stringify(data), keterangan: keterangan || null },
        update: { data: JSON.stringify(data), keterangan: keterangan || null },
      });
      revalidatePath("/kelola-lampid/bulanan");
      return { status: 200, id: saved.id, message: `Laporan ${BULAN_NAMES[b - 1]} ${t} berhasil disimpan` };
    }

    if (operation === "listSaved") {
      const saved = await prisma.laporanLampidBulanan.findMany({
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
      const saved = await prisma.laporanLampidBulanan.findUnique({ where: { id } });
      if (!saved) throw new ApiError(status.NOT_FOUND, "Laporan tidak ditemukan");
      return { status: 200, data: JSON.parse(saved.data) as LampidBulananData };
    }

    if (operation === "deleteSaved") {
      const { id } = (payload ?? {}) as { id?: number };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID tidak valid");
      await prisma.laporanLampidBulanan.delete({ where: { id } });
      revalidatePath("/kelola-lampid/bulanan");
      return { status: 200, message: "Laporan berhasil dihapus" };
    }

    if (operation === "export") {
      const { bulan, tahun } = (payload ?? {}) as { bulan?: number; tahun?: number };
      const now = new Date();
      const b = bulan ?? now.getMonth() + 1;
      const t = tahun ?? now.getFullYear();
      const data = await generateLampidBulananData(b, t);
      const base64 = await buildExcelBulanan(data);
      return {
        status: 200,
        data: base64,
        filename: `Laporan_Lampid_Bulanan_${BULAN_NAMES[b - 1]}_${t}.xlsx`,
      };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (lampidBulanan):", error);
    return { status: 500, error: "Terjadi kesalahan pada server" };
  }
}
