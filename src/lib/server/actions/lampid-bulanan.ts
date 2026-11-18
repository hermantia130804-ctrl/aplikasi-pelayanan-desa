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

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

// ===== Tipe data =====
interface Triplet { lk: number; pr: number; jml: number; }
interface TripleKK { wajib: number; memiliki: number; belum: number; }

interface RowData {
  // RW hanya diisi pada baris pertama setiap grup RW; baris RT kedua dst. dan baris "Jumlah" dikosongkan
  rw: string;
  // "Jumlah" untuk subtotal per RW; "Jml.Ttl" untuk grand total; nomor RT untuk baris biasa
  rt: string;
  isSubtotal: boolean;
  isGrandTotal: boolean;
  jmlPddkBlnLalu: Triplet;
  lahir: Triplet;
  mati: Triplet;
  datang: Triplet;
  pindah: Triplet;
  jmlPddkBlnIni: Triplet;
  kk: TripleKK;
  ktp: TripleKK;
}

interface AgamaRow { label: string; lk: number; pr: number; jml: number; }

interface LampidBulananData {
  bulan: number;
  tahun: number;
  bulanLabel: string;
  tanggalCetak: string;
  rows: RowData[];
  agamaRows: AgamaRow[];
  agamaTotal: Triplet;
}

// Hitung umur pada tanggal referensi
function hitungUmurTahun(tanggalLahir: Date, refDate: Date): number {
  let umur = refDate.getFullYear() - tanggalLahir.getFullYear();
  const m = refDate.getMonth() - tanggalLahir.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < tanggalLahir.getDate())) umur--;
  return umur < 0 ? 0 : umur;
}

// Parse "001"/"01"/"1" ke number untuk sorting numerik ascending
function parseNo(s: string | null | undefined): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/^0+/, "") || "0", 10);
  return isNaN(n) ? 0 : n;
}

// Normalisasi jenisKelamin: "LAKI-LAKI"/"L"/"LAKI_LAKI" → true (laki-laki)
function isLakiLaki(jk: string | null | undefined): boolean {
  const u = (jk || "").toUpperCase().trim();
  return u === "LAKI-LAKI" || u === "LAKI_LAKI" || u === "L" || u === "LAKILAKI";
}

// ===== Generate data laporan bulanan dari DB =====
// Logika perhitungan sesuai Excel JULI 2026:
//   - bln_ini  = snapshot populasi pada akhir bulan terpilih (endDate)
//   - bln_lalu = snapshot populasi pada akhir bulan sebelumnya (prevEndDate)
//   - lahir/mati/datang/pindah = kejadian yang terjadi di bulan terpilih saja
//   - urutan: RW ascending numeric, lalu RT ascending numeric
//   - RW hanya ditampilkan di baris pertama grup RW (baris RT kedua dst. dan "Jumlah" dikosongkan)
async function generateLampidBulananData(bulan: number, tahun: number): Promise<LampidBulananData> {
  // Periode
  const startDate = new Date(tahun, bulan - 1, 1);                          // 1 hari pertama bulan terpilih
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);                    // akhir hari terakhir bulan terpilih
  const prevEndDate = new Date(tahun, bulan - 1, 0, 23, 59, 59);            // akhir hari terakhir bulan sebelumnya
  const refDate = new Date(tahun, bulan - 1, 15);                           // tengah bulan untuk hitung umur KTP

  // Fetch data
  const allWarga = await prisma.dataWarga.findMany();
  const allKejadian = await prisma.kejadian.findMany();

  // Build lookup noKk -> { noRt, noRw } untuk atribusi kejadian ke RT/RW
  const kkToRtMap = new Map<string, { noRt: string; noRw: string }>();
  for (const w of allWarga) {
    if (w.noKk && w.noRt && w.noRw) {
      kkToRtMap.set(w.noKk, { noRt: w.noRt, noRw: w.noRw });
    }
  }

  // Build lookup NIK -> jenisKelamin (prioritas: DataWarga, fallback Kejadian)
  const nikToJenisKelamin = new Map<string, string>();
  for (const w of allWarga) {
    if (w.nik) nikToJenisKelamin.set(w.nik, w.jenisKelamin);
  }
  for (const k of allKejadian) {
    if (k.nik && k.jenisKelamin && !nikToJenisKelamin.has(k.nik)) {
      nikToJenisKelamin.set(k.nik, k.jenisKelamin);
    }
  }

  // Build lookup kejadian per NIK (sorted asc by tanggal)
  const kejadianByNik = new Map<string, typeof allKejadian>();
  for (const k of allKejadian) {
    if (!k.nik) continue;
    if (!kejadianByNik.has(k.nik)) kejadianByNik.set(k.nik, []);
    kejadianByNik.get(k.nik)!.push(k);
  }
  for (const arr of kejadianByNik.values()) {
    arr.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
  }

  // Set NIK yang ada di DB saat ini (untuk cek "data lama")
  const nikInCurrentDb = new Set<string>();
  for (const w of allWarga) {
    if (w.nik) nikInCurrentDb.add(w.nik);
  }

  // Helper: tentukan apakah warga (by NIK) ada di snapshot pada snapshotDate
  // Berdasarkan riwayat kejadian: LAHIR/DATANG = masuk, MATI/PINDAH = keluar
  function isAliveAt(nik: string, snapshotDate: Date): boolean {
    const kejs = kejadianByNik.get(nik) || [];
    let alive = false;
    let hasLahirDatang = false;
    for (const k of kejs) {
      if (k.tanggal > snapshotDate) break;
      const jk = (k.jenisKejadian || "").toUpperCase();
      if (jk === "LAHIR" || jk === "DATANG") {
        alive = true;
        hasLahirDatang = true;
      } else if (jk === "MATI" || jk === "PINDAH") {
        alive = false;
      }
    }
    // Jika warga ada di DB saat ini DAN tidak ada kejadian LAHIR/DATANG sama sekali
    // → asumsi data lama (sudah ada sebelum snapshotDate)
    if (nikInCurrentDb.has(nik) && !hasLahirDatang) {
      const matiPindahSebelumSnapshot = kejs.some(k => {
        const jk = (k.jenisKejadian || "").toUpperCase();
        return (jk === "MATI" || jk === "PINDAH") && k.tanggal <= snapshotDate;
      });
      if (!matiPindahSebelumSnapshot) alive = true;
    }
    return alive;
  }

  // ===== Dapatkan daftar unik (noRt, noRw) =====
  // Termasuk RT yang warganya sudah dihapus dari DB (untuk kompatibilitas kejadian lama via kkToRtMap)
  const rtSet = new Set<string>();
  for (const w of allWarga) {
    if (w.noRt && w.noRw) rtSet.add(`${w.noRt}|${w.noRw}`);
  }
  for (const rt of kkToRtMap.values()) {
    rtSet.add(`${rt.noRt}|${rt.noRw}`);
  }
  const rtList = Array.from(rtSet).map(s => {
    const [noRt, noRw] = s.split("|");
    return { noRt, noRw };
  }).sort((a, b) => {
    // Urutkan RW ascending numeric, lalu RT ascending numeric
    const rwA = parseNo(a.noRw);
    const rwB = parseNo(b.noRw);
    if (rwA !== rwB) return rwA - rwB;
    return parseNo(a.noRt) - parseNo(b.noRt);
  });

  // ===== Hitung per RT =====
  const rows: RowData[] = [];
  const rwSubtotals = new Map<string, RowData>();
  let lastRw = "";

  for (const { noRt, noRw } of rtList) {
    // Warga di RT ini (dari DB saat ini)
    const wargaRT = allWarga.filter(w => w.noRt === noRt && w.noRw === noRw);

    // KK set untuk RT ini (dari warga current + dari kkToRtMap)
    const kkSetRT = new Set<string>();
    for (const w of wargaRT) {
      if (w.noKk) kkSetRT.add(w.noKk);
    }
    for (const [kk, rt] of kkToRtMap.entries()) {
      if (rt.noRt === noRt && rt.noRw === noRw) kkSetRT.add(kk);
    }

    // NIK yang pernah ada di RT ini (current + historis via Kejadian)
    const nikHistorisRT = new Set<string>();
    for (const w of wargaRT) {
      if (w.nik) nikHistorisRT.add(w.nik);
    }
    for (const k of allKejadian) {
      if (k.nik && k.noKk && kkSetRT.has(k.noKk)) {
        nikHistorisRT.add(k.nik);
      }
    }

    // Hitung bln_ini & bln_lalu berdasarkan isAliveAt
    let lkBlnIni = 0, prBlnIni = 0;
    let lkBlnLalu = 0, prBlnLalu = 0;
    for (const nik of nikHistorisRT) {
      const aliveIni = isAliveAt(nik, endDate);
      const aliveLalu = isAliveAt(nik, prevEndDate);
      const isL = isLakiLaki(nikToJenisKelamin.get(nik));
      if (aliveIni) { if (isL) lkBlnIni++; else prBlnIni++; }
      if (aliveLalu) { if (isL) lkBlnLalu++; else prBlnLalu++; }
    }

    const jmlPddkBlnIni: Triplet = { lk: lkBlnIni, pr: prBlnIni, jml: lkBlnIni + prBlnIni };
    const jmlPddkBlnLalu: Triplet = { lk: lkBlnLalu, pr: prBlnLalu, jml: lkBlnLalu + prBlnLalu };

    // Kejadian dalam bulan terpilih (atribusi via noKk)
    const lahir: Triplet = { lk: 0, pr: 0, jml: 0 };
    const mati: Triplet = { lk: 0, pr: 0, jml: 0 };
    const datang: Triplet = { lk: 0, pr: 0, jml: 0 };
    const pindah: Triplet = { lk: 0, pr: 0, jml: 0 };

    for (const k of allKejadian) {
      if (!k.noKk || !kkSetRT.has(k.noKk)) continue;
      if (k.tanggal < startDate || k.tanggal > endDate) continue;
      const jkType = (k.jenisKejadian || "").toUpperCase();
      const target = jkType === "LAHIR" ? lahir
        : jkType === "MATI" ? mati
        : jkType === "DATANG" ? datang
        : jkType === "PINDAH" ? pindah
        : null;
      if (!target) continue;
      if (isLakiLaki(k.jenisKelamin)) target.lk++; else target.pr++;
      target.jml++;
    }

    // KK & KTP: hitung dari warga yang alive di endDate
    const wargaAliveIni = wargaRT.filter(w => isAliveAt(w.nik, endDate));
    const kkWajib = wargaAliveIni.filter(w =>
      (w.statusKeluarga || "").toUpperCase() === "KEPALA KELUARGA"
    ).length;
    const kk: TripleKK = { wajib: kkWajib, memiliki: kkWajib, belum: 0 };

    const wajibKTP = wargaAliveIni.filter(w =>
      hitungUmurTahun(w.tanggalLahir, refDate) >= 17
    ).length;
    const punyaKTP = wargaAliveIni.filter(w =>
      (w.punyaKtp || "").toUpperCase() === "PUNYA"
    ).length;
    const ktp: TripleKK = {
      wajib: wajibKTP,
      memiliki: punyaKTP,
      belum: Math.max(0, wajibKTP - punyaKTP),
    };

    // Set row.rw hanya di baris pertama grup RW
    const isNewRw = noRw !== lastRw;
    const row: RowData = {
      rw: isNewRw ? noRw : "",
      rt: noRt,
      isSubtotal: false,
      isGrandTotal: false,
      jmlPddkBlnLalu, lahir, mati, datang, pindah, jmlPddkBlnIni, kk, ktp,
    };
    rows.push(row);
    lastRw = noRw;

    // Akumulasi subtotal per RW
    if (!rwSubtotals.has(noRw)) {
      rwSubtotals.set(noRw, {
        rw: "", rt: "Jumlah", isSubtotal: true, isGrandTotal: false,
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
    const sub = rwSubtotals.get(noRw)!;
    (["jmlPddkBlnLalu", "lahir", "mati", "datang", "pindah", "jmlPddkBlnIni"] as const).forEach(k => {
      sub[k].lk += row[k].lk; sub[k].pr += row[k].pr; sub[k].jml += row[k].jml;
    });
    sub.kk.wajib += row.kk.wajib; sub.kk.memiliki += row.kk.memiliki; sub.kk.belum += row.kk.belum;
    sub.ktp.wajib += row.ktp.wajib; sub.ktp.memiliki += row.ktp.memiliki; sub.ktp.belum += row.ktp.belum;
  }

  // ===== Sisipkan baris "Jumlah" setelah grup RW selesai =====
  const rowsWithSubtotals: RowData[] = [];
  let currentRw = "";
  for (const row of rows) {
    // row.rw !== "" artinya baris pertama grup RW baru
    if (row.rw !== "" && currentRw !== "" && row.rw !== currentRw) {
      // RW berubah → sisipkan subtotal RW sebelumnya
      if (rwSubtotals.has(currentRw)) {
        rowsWithSubtotals.push(rwSubtotals.get(currentRw)!);
      }
    }
    rowsWithSubtotals.push(row);
    if (row.rw !== "") currentRw = row.rw;
  }
  // Sisipkan subtotal untuk RW terakhir
  if (currentRw !== "" && rwSubtotals.has(currentRw)) {
    rowsWithSubtotals.push(rwSubtotals.get(currentRw)!);
  }

  // ===== Grand total (sum dari subtotal rows saja, hindari double-count) =====
  const grand: RowData = {
    rw: "", rt: "Jml.Ttl", isSubtotal: false, isGrandTotal: true,
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
    // Hanya sum subtotal rows (sudah merupakan akumulasi RT per RW)
    if (!r.isSubtotal) continue;
    (["jmlPddkBlnLalu", "lahir", "mati", "datang", "pindah", "jmlPddkBlnIni"] as const).forEach(k => {
      grand[k].lk += r[k].lk; grand[k].pr += r[k].pr; grand[k].jml += r[k].jml;
    });
    grand.kk.wajib += r.kk.wajib; grand.kk.memiliki += r.kk.memiliki; grand.kk.belum += r.kk.belum;
    grand.ktp.wajib += r.ktp.wajib; grand.ktp.memiliki += r.ktp.memiliki; grand.ktp.belum += r.ktp.belum;
  }
  rowsWithSubtotals.push(grand);

  // ===== Penganut agama: hanya warga alive di endDate =====
  const agamaMap = new Map<string, Triplet>();
  for (const w of allWarga) {
    if (!isAliveAt(w.nik, endDate)) continue;
    const agama = (w.agama || "LAINNYA").toUpperCase();
    if (!agamaMap.has(agama)) agamaMap.set(agama, { lk: 0, pr: 0, jml: 0 });
    const a = agamaMap.get(agama)!;
    if (isLakiLaki(w.jenisKelamin)) a.lk++; else a.pr++;
    a.jml++;
  }
  const agamaRows: AgamaRow[] = Array.from(agamaMap.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.jml - a.jml);
  const agamaTotal: Triplet = agamaRows.reduce((acc, r) => ({
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

// ===== EXPORT EXCEL =====
// Layout mengikuti sheet JULI 2026 dari file Excel acuan:
//   - Kop lengkap: logo + PEMERINTAH KAB. BOGOR / KECAMATAN CIBUNGBULANG / DESA SUKAMAJU / Alamat
//   - LAPORAN PENDUDUK + BULAN + TAHUN
//   - Header 2 baris: RW, RT (rowSpan=2) lalu 8 grup × 3 sub-kolom (Lk/Pr/Jml) + 2 grup × 3 (Wajib/Memiliki/Belum)
//   - Baris "Jumlah" per RW dengan subtotal
//   - Baris "Jml.Ttl" grand total di paling bawah
//   - Signature + Penganut Agama di bawah
async function buildExcelBulanan(data: LampidBulananData): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Laporan Penduduk", {
    views: [{ showGridLines: false }],
  });

  const COLOR_HEADER = "FF4472C4";
  const COLOR_HEADER_TEXT = "FFFFFFFF";
  const COLOR_SUBTOTAL = "FFD6E4F0";
  const COLOR_GRANDTOTAL = "FFB4C7E7";
  const COLOR_AGAMA_HEADER = "FFFFF2CC";
  const COLOR_BORDER = "FF000000";
  const thinBorder = {
    top: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    left: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    right: { style: "thin" as const, color: { argb: COLOR_BORDER } },
    bottom: { style: "thin" as const, color: { argb: COLOR_BORDER } },
  };

  // Set lebar kolom individually (lebih reliable daripada ws.columns dengan spread)
  ws.getColumn(1).width = 5;   // RW
  ws.getColumn(2).width = 5;   // RT
  for (let i = 3; i <= 20; i++) ws.getColumn(i).width = 5;   // C-T: 6 grup × Lk/Pr/Jml
  for (let i = 21; i <= 26; i++) ws.getColumn(i).width = 9;  // U-Z: KK + KTP × Wajib/Memiliki/Belum
  for (let i = 27; i <= 32; i++) ws.getColumn(i).width = 9;  // extra margin cols

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

  const merge = (r1: number, c1: number, r2: number, c2: number) => {
    ws.mergeCells(r1, c1, r2, c2);
  };

  // ===== KOP LENGKAP (logo + PEMERINTAH KAB. BOGOR / KECAMATAN / DESA / Alamat) =====
  const logoBase64Data = LOGO_KAB_BOGOR_BASE64.split(",")[1];
  const imageId = wb.addImage({
    buffer: Buffer.from(logoBase64Data, "base64") as unknown as ArrayBuffer,
    extension: "png",
  });
  // Logo diperbesar supaya sejajar dengan 4 baris kop (height ~100px)
  ws.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 90, height: 90 },
  });

  // Kop pemerintah — mulai col D=4, merge sampai col N=14 (cukup lebar untuk text panjang)
  merge(1, 4, 1, 14);
  setCell(1, 4, "PEMERINTAH KABUPATEN BOGOR", { bold: true, align: "left", fontSize: 12, border: false });
  merge(2, 4, 2, 14);
  setCell(2, 4, "KECAMATAN CIBUNGBULANG", { bold: true, align: "left", fontSize: 12, border: false });
  merge(3, 4, 3, 14);
  setCell(3, 4, "DESA SUKAMAJU", { bold: true, align: "left", fontSize: 12, border: false });
  merge(4, 4, 4, 14);
  setCell(4, 4, `Alamat : ${ALAMAT_DESA}`, { align: "left", fontSize: 9, border: false });

  // LAPORAN PENDUDUK + BULAN + TAHUN
  merge(5, 4, 5, 14);
  setCell(5, 4, "LAPORAN PENDUDUK", { bold: true, align: "left", fontSize: 12, border: false });
  merge(6, 4, 6, 14);
  setCell(6, 4, `BULAN : ${data.bulanLabel}`, { align: "left", border: false });
  merge(7, 4, 7, 14);
  setCell(7, 4, `TAHUN : ${data.tahun}`, { align: "left", border: false });

  // ===== Tabel header (2 baris) =====
  // Header tabel mulai row 9 (setelah kop 7 baris + 1 baris kosong pemisah)
  const HEADER_ROW1 = 9;
  const HEADER_ROW2 = 10;

  // RW & RT (rowSpan=2)
  setCell(HEADER_ROW1, 1, "RW", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  merge(HEADER_ROW1, 1, HEADER_ROW2, 1);
  setCell(HEADER_ROW1, 2, "RT", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  merge(HEADER_ROW1, 2, HEADER_ROW2, 2);

  // 6 grup × 3 sub-kolom: Jml Pddk Bln Lalu, Lahir, Mati, Datang, Pindah, Jml.Pddk Bln ini
  const groupNames = ["Jml Pddk Bln Lalu", "Lahir", "Mati", "Datang", "Pindah", "Jml.Pddk Bln ini"];
  let col = 3;
  for (const name of groupNames) {
    merge(HEADER_ROW1, col, HEADER_ROW1, col + 2);
    setCell(HEADER_ROW1, col, name, { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    setCell(HEADER_ROW2, col, "Lk", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    setCell(HEADER_ROW2, col + 1, "Pr", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    setCell(HEADER_ROW2, col + 2, "Jml", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
    col += 3;
  }

  // Kartu Keluarga (Wajib, Memiliki, Belum)
  merge(HEADER_ROW1, col, HEADER_ROW1, col + 2);
  setCell(HEADER_ROW1, col, "Kartu Keluarga", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col, "Wajib", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 1, "Memiliki", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 2, "Belum", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  col += 3;

  // Kartu Tanda Penduduk (Wajib, Memiliki, Belum)
  merge(HEADER_ROW1, col, HEADER_ROW1, col + 2);
  setCell(HEADER_ROW1, col, "Kartu Tanda Penduduk", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col, "Wajib", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 1, "Memiliki", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });
  setCell(HEADER_ROW2, col + 2, "Belum", { bold: true, fill: COLOR_HEADER, fontColor: COLOR_HEADER_TEXT });

  // ===== Data rows =====
  let rowIdx = HEADER_ROW2 + 1;
  for (const row of data.rows) {
    const fill = row.isGrandTotal ? COLOR_GRANDTOTAL : row.isSubtotal ? COLOR_SUBTOTAL : undefined;
    const bold = row.isGrandTotal || row.isSubtotal;
    const rtLabel = row.isGrandTotal ? "Jml.Ttl" : row.isSubtotal ? "Jumlah" : row.rt;

    // RW hanya ditampilkan kalau row.rw !== "" (sudah di-set backend hanya di baris pertama grup)
    setCell(rowIdx, 1, row.rw || "", { bold, fill });
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

  // ===== Signature + Penganut Agama =====
  const sigRow = rowIdx + 1;
  setCell(sigRow, 21, `SUKAMAJU, ${data.tanggalCetak}`, { align: "center", border: false });
  setCell(sigRow + 1, 21, "KEPALA DESA SUKAMAJU", { align: "center", border: false });
  setCell(sigRow + 3, 21, NAMA_KEPALA_DESA, { align: "center", bold: true, border: false });

  const agRow = sigRow;
  merge(agRow, 3, agRow, 5);
  setCell(agRow, 3, "PENGANUT GOLONGAN AGAMA", { bold: true, fill: COLOR_AGAMA_HEADER, align: "left" });

  const agamaToShow = data.agamaRows.slice(0, 4);
  const agamaHeader = [...agamaToShow.map(a => a.label), "JUMLAH"];
  let agCol = 3;
  for (let i = 0; i < agamaHeader.length; i++) {
    merge(agRow + 1, agCol, agRow + 1, agCol + 2);
    setCell(agRow + 1, agCol, agamaHeader[i], { bold: true, fill: COLOR_AGAMA_HEADER });
    setCell(agRow + 2, agCol, "L", { bold: true, fill: COLOR_AGAMA_HEADER });
    setCell(agRow + 2, agCol + 1, "P", { bold: true, fill: COLOR_AGAMA_HEADER });
    setCell(agRow + 2, agCol + 2, "JML", { bold: true, fill: COLOR_AGAMA_HEADER });
    agCol += 3;
  }
  agCol = 3;
  for (let i = 0; i < agamaToShow.length; i++) {
    const a = agamaToShow[i];
    setCell(agRow + 3, agCol, a.lk);
    setCell(agRow + 3, agCol + 1, a.pr);
    setCell(agRow + 3, agCol + 2, a.jml);
    agCol += 3;
  }
  setCell(agRow + 3, agCol, data.agamaTotal.lk, { bold: true });
  setCell(agRow + 3, agCol + 1, data.agamaTotal.pr, { bold: true });
  setCell(agRow + 3, agCol + 2, data.agamaTotal.jml, { bold: true });

  ws.getRow(HEADER_ROW1).height = 20;
  ws.getRow(HEADER_ROW2).height = 18;

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
