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

// ===== EXPORT EXCEL — format PERSIS sheet JULI 2026 =====
function buildExcelBulanan(data: LampidBulananData): string {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([[]]);

  // 26 columns: A..Z (RW, RT, then 8 groups x 3 cols, then 2 groups x 3 cols)
  // A:RW, B:RT, C-E:JmlPddkBlnLalu, F-H:Lahir, I-K:Mati, L-N:Datang, O-Q:Pindah, R-T:JmlPddkBlnIni, U-W:KK, X-Z:KTP
  const LAST_COL = "Z";
  const setCell = (ref: string, val: string | number) => {
    ws[ref] = { v: val, t: typeof val === "number" ? "n" : "s" };
  };
  const addMerge = (startRef: string, endRef: string) => {
    if (!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"]!.push({ s: XLSX.utils.decode_cell(startRef), e: XLSX.utils.decode_cell(endRef) });
  };

  // Row 1: PEMERINTAH KABUPATEN BOGOR (merged across A1:Z1, centered)
  setCell("A1", "PEMERINTAH KABUPATEN BOGOR");
  addMerge("A1", `${LAST_COL}1`);
  // Row 2: KECAMATAN CIBUNGBULANG
  setCell("A2", "KECAMATAN CIBUNGBULANG");
  addMerge("A2", `${LAST_COL}2`);
  // Row 3: DESA SUKAMAJU
  setCell("A3", "DESA SUKAMAJU");
  addMerge("A3", `${LAST_COL}3`);
  // Row 4: LAPORAN PENDUDUK
  setCell("A4", "LAPORAN PENDUDUK");
  addMerge("A4", `${LAST_COL}4`);
  // Row 5: BULAN
  setCell("A5", `BULAN : ${data.bulanLabel}`);
  addMerge("A5", `${LAST_COL}5`);
  // Row 6: TAHUN
  setCell("A6", `TAHUN : ${data.tahun}`);
  addMerge("A6", `${LAST_COL}6`);

  // Row 7: Header row 1 (group names)
  setCell("A7", "RW"); addMerge("A7", "A8");
  setCell("B7", "RT"); addMerge("B7", "B8");
  setCell("C7", "Jml Pddk Bln Lalu"); addMerge("C7", "E7");
  setCell("F7", "Lahir"); addMerge("F7", "H7");
  setCell("I7", "Mati"); addMerge("I7", "K7");
  setCell("L7", "Datang"); addMerge("L7", "N7");
  setCell("O7", "Pindah"); addMerge("O7", "Q7");
  setCell("R7", "Jml.Pddk Bln ini"); addMerge("R7", "T7");
  setCell("U7", "Kartu Keluarga"); addMerge("U7", "W7");
  setCell("X7", "Kartu Tanda Penduduk"); addMerge("X7", "Z7");

  // Row 8: Header row 2 (sub-columns)
  const subHeaders = ["Lk", "Pr", "Jml"];
  const subPositions = ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];
  subPositions.forEach((col, i) => {
    setCell(`${col}8`, subHeaders[i % 3]);
  });
  ["U", "V", "W", "X", "Y", "Z"].forEach((col, i) => {
    const labels = ["Wajib", "Memiliki", "Belum"];
    setCell(`${col}8`, labels[i % 3]);
  });

  // Data rows starting from row 9
  let rowIdx = 9;
  for (const row of data.rows) {
    const r = rowIdx;
    if (row.isGrandTotal) {
      setCell(`A${r}`, ""); setCell(`B${r}`, "Jml.Ttl");
    } else if (row.isSubtotal) {
      setCell(`A${r}`, row.rw); setCell(`B${r}`, "Jumlah");
    } else {
      setCell(`A${r}`, row.rw); setCell(`B${r}`, row.rt);
    }
    const groups = [row.jmlPddkBlnLalu, row.lahir, row.mati, row.datang, row.pindah, row.jmlPddkBlnIni];
    let colIdx = 2; // C
    for (const g of groups) {
      setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: colIdx })}`, g.lk);
      setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: colIdx + 1 })}`, g.pr);
      setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: colIdx + 2 })}`, g.jml);
      colIdx += 3;
    }
    setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: 20 })}`, row.kk.wajib);
    setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: 21 })}`, row.kk.memiliki);
    setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: 22 })}`, row.kk.belum);
    setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: 23 })}`, row.ktp.wajib);
    setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: 24 })}`, row.ktp.memiliki);
    setCell(`${XLSX.utils.encode_cell({ r: r - 1, c: 25 })}`, row.ktp.belum);
    rowIdx++;
  }

  // Signature row (right side)
  const sigRow = rowIdx + 1;
  setCell(`U${sigRow}`, `SUKAMAJU, ${data.tanggalCetak}`);
  setCell(`U${sigRow + 1}`, "KEPALA DESA SUKAMAJU");
  setCell(`U${sigRow + 3}`, NAMA_KEPALA_DESA);

  // Penganut agama (left side)
  const agamaStartRow = sigRow;
  setCell(`C${agamaStartRow}`, "PENGANUT GOLONGAN AGAMA");
  // Header agama: dinamis per agama yang ada di DB, max 4 kolom group (3 cols each)
  const agamaToShow = data.agamaRows.slice(0, 4); // maks 4 agama untuk fit header
  // Tambah kolom JUMLAH di akhir
  const agamaHeader = [...agamaToShow.map(a => a.label), "JUMLAH"];
  let agCol = 2; // start at C
  for (let i = 0; i < agamaHeader.length; i++) {
    const colStart = XLSX.utils.encode_cell({ r: agamaStartRow, c: agCol });
    const colEnd = XLSX.utils.encode_cell({ r: agamaStartRow, c: agCol + 2 });
    setCell(colStart, agamaHeader[i]);
    addMerge(colStart, colEnd);
    // Sub-header L/P/JML
    setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 1, c: agCol }), "L");
    setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 1, c: agCol + 1 }), "P");
    setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 1, c: agCol + 2 }), "JML");
    agCol += 3;
  }
  // Data agama row
  agCol = 2;
  for (let i = 0; i < agamaToShow.length; i++) {
    const a = agamaToShow[i];
    setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 2, c: agCol }), a.lk);
    setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 2, c: agCol + 1 }), a.pr);
    setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 2, c: agCol + 2 }), a.jml);
    agCol += 3;
  }
  // JUMLAH total
  setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 2, c: agCol }), data.agamaTotal.lk);
  setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 2, c: agCol + 1 }), data.agamaTotal.pr);
  setCell(XLSX.utils.encode_cell({ r: agamaStartRow + 2, c: agCol + 2 }), data.agamaTotal.jml);

  // Set column widths
  ws["!cols"] = [
    { wch: 6 }, { wch: 8 }, // RW, RT
    ...Array(24).fill({ wch: 6 }), // C-Z
  ];
  ws["!ref"] = `A1:${LAST_COL}${agamaStartRow + 4}`;

  XLSX.utils.book_append_sheet(wb, ws, "Laporan Penduduk");
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" });
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
      const base64 = buildExcelBulanan(data);
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
