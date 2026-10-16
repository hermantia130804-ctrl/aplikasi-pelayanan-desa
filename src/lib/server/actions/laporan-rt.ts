"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { hitungUmur, isWajibKTP } from "../utils/kependudukan";

const BULAN_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
];

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

export async function laporanRTAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const whereUser = isStaff ? {} : { userId: session.user.userId };
    const rtId = 1; // deployment single-RT (RT 001 RW 002) = default model asli

    // ===== GENERATE (port: GET /api/laporan) =====
    if (operation === "generate") {
      const { bulan: bIn, tahun: tIn } = (payload ?? {}) as { bulan?: number; tahun?: number };
      const now = new Date();
      const bulan = bIn ?? now.getMonth() + 1;
      const tahun = tIn ?? now.getFullYear();
      const data = await generateReportData(bulan, tahun, whereUser);
      return { status: 200, data };
    }

    // ===== LIST SAVED (port: GET /api/laporan/save) =====
    if (operation === "listSaved") {
      const saved = await prisma.laporanBulanan.findMany({
        where: { rtId },
        orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      });
      const result = saved.map(s => ({
        id: s.id,
        bulan: s.bulan,
        tahun: s.tahun,
        keterangan: s.keterangan || "",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      return { status: 200, data: result };
    }

    // ===== SAVE (port: POST /api/laporan/save) =====
    if (operation === "save") {
      if (!isStaff && session.user.role !== "RT") throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      const { bulan: bIn, tahun: tIn, keterangan } = (payload ?? {}) as { bulan?: number; tahun?: number; keterangan?: string };
      const now = new Date();
      const bulan = bIn ?? now.getMonth() + 1;
      const tahun = tIn ?? now.getFullYear();
      const reportData = await generateReportData(bulan, tahun, whereUser);

      const saved = await prisma.laporanBulanan.upsert({
        where: { rtId_bulan_tahun: { rtId, bulan, tahun } },
        create: { rtId, bulan, tahun, data: JSON.stringify(reportData), keterangan: keterangan || null },
        update: { data: JSON.stringify(reportData), keterangan: keterangan || null },
      });
      revalidatePath("/data-warga");
      return { status: 200, id: saved.id, message: `Laporan ${bulan}/${tahun} berhasil disimpan` };
    }

    // ===== SIMPAN KETERANGAN (port: PATCH /api/laporan/save) =====
    if (operation === "saveKeterangan") {
      if (!isStaff && session.user.role !== "RT") throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      const { id, bulan: bIn, tahun: tIn, keterangan } = (payload ?? {}) as { id?: number; bulan?: number; tahun?: number; keterangan?: string };

      let record: { id: number } | null = null;
      if (id) {
        record = await prisma.laporanBulanan.findUnique({ where: { id } });
      } else if (bIn && tIn) {
        record = await prisma.laporanBulanan.findUnique({
          where: { rtId_bulan_tahun: { rtId, bulan: bIn, tahun: tIn } },
        });
      }

      if (!record) {
        const bulan = bIn ?? new Date().getMonth() + 1;
        const tahun = tIn ?? new Date().getFullYear();
        const reportData = await generateReportData(bulan, tahun, whereUser);
        record = await prisma.laporanBulanan.create({
          data: { rtId, bulan, tahun, data: JSON.stringify(reportData), keterangan: keterangan || null },
        });
      } else {
        record = await prisma.laporanBulanan.update({
          where: { id: record.id },
          data: { keterangan: keterangan || null },
        });
      }
      revalidatePath("/data-warga");
      return { status: 200, message: "Keterangan berhasil disimpan" };
    }

    // ===== DELETE SAVED (port: DELETE /api/laporan/save?id=) =====
    if (operation === "deleteSaved") {
      if (!isStaff && session.user.role !== "RT") throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      const { id } = (payload ?? {}) as { id?: number };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID tidak valid");
      const record = await prisma.laporanBulanan.findUnique({ where: { id } });
      if (!record) throw new ApiError(status.NOT_FOUND, "Laporan tidak ditemukan.");
      await prisma.laporanBulanan.delete({ where: { id } });
      revalidatePath("/data-warga");
      return { status: 200, message: "Laporan berhasil dihapus" };
    }

    // ===== EXPORT (port: GET /api/laporan/export) =====
    if (operation === "export") {
      const { bulan: bIn, tahun: tIn } = (payload ?? {}) as { bulan?: number; tahun?: number };
      const now = new Date();
      const bulan = bIn ?? now.getMonth() + 1;
      const tahun = tIn ?? now.getFullYear();
      const data = await generateReportData(bulan, tahun, whereUser);

      const asCell = (label: string): string | number => {
        const n = Number(label);
        return isNaN(n) ? label : n;
      };

      const summaries = [
        { name: 'PENDUDUK', l: data.summary.penduduk.l, p: data.summary.penduduk.p },
        { name: 'WAJIB KTP 17+', l: data.summary.wajibKTP.l, p: data.summary.wajibKTP.p },
        { name: 'KARTU KELUARGA', l: data.summary.kartuKeluarga.l, p: data.summary.kartuKeluarga.p },
        { name: 'PENDUDUK SEMENTARA', l: data.summary.pendudukSementara.l, p: data.summary.pendudukSementara.p },
        { name: 'LAHIR', l: data.summary.lahir.l, p: data.summary.lahir.p },
        { name: 'MATI', l: data.summary.mati.l, p: data.summary.mati.p },
        { name: 'PINDAH', l: data.summary.pindah.l, p: data.summary.pindah.p },
        { name: 'DATANG', l: data.summary.datang.l, p: data.summary.datang.p },
      ];
      const summaryStartRows = [6, 11, 16, 21, 26, 31, 36, 41];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([[]]);
      ws['!cols'] = [
        { wch: 2 }, { wch: 2 }, { wch: 12 }, { wch: 5 }, { wch: 5 },
        { wch: 2 }, { wch: 8 }, { wch: 5 }, { wch: 5 },
        { wch: 2 }, { wch: 22 }, { wch: 8 }, { wch: 8 },
      ];

      const merges: XLSX.Range[] = [];
      const setCell = (ref: string, val: string | number) => {
        ws[ref] = { v: val, t: typeof val === 'number' ? 'n' : 's' };
      };
      const addMerge = (startRef: string, endRef: string) => {
        merges.push({ s: XLSX.utils.decode_cell(startRef), e: XLSX.utils.decode_cell(endRef) });
      };

      // Title rows
      setCell('C2', 'LAPORAN DATA (LAHIR, MENINGGAL, PINDAH DAN DATANG) PENDUDUK');
      addMerge('C2', 'M2');
      setCell('C3', 'DESA SUKAMAJU KECAMATAN CIBUNGBULANG KABUPATEN BOGOR');
      addMerge('C3', 'M3');
      setCell('C4', `RT 001 RW 002 BULAN ${BULAN_NAMES[bulan - 1]} TAHUN ${tahun}`);
      addMerge('C4', 'M4');

      // Header row
      setCell('C6', 'USIA'); setCell('D6', 'L'); setCell('E6', 'P');
      setCell('G6', 'USIA'); setCell('H6', 'L'); setCell('I6', 'P');
      setCell('K6', 'PENDUDUK'); addMerge('K6', 'L6');
      setCell('M6', 'JUMLAH'); addMerge('M6', 'M7');

      // Left side: 39 rows (0-11 BLN, 1..38) at rows 7-45
      for (let i = 0; i < data.leftAges.length; i++) {
        const row = i + 7;
        const left = data.leftAges[i];
        setCell(`C${row}`, asCell(left.label));
        setCell(`D${row}`, left.l);
        setCell(`E${row}`, left.p);
      }

      // Right side: 37 rows at 7-43 + JUMLAH at 44-45 (merged)
      const rightNoJumlah = data.rightAges.filter(r => r.label !== 'JUMLAH');
      const jumlahRight = data.rightAges.find(r => r.label === 'JUMLAH');
      for (let i = 0; i < rightNoJumlah.length; i++) {
        const row = i + 7;
        const right = rightNoJumlah[i];
        setCell(`G${row}`, asCell(right.label));
        setCell(`H${row}`, right.l);
        setCell(`I${row}`, right.p);
      }
      setCell('G44', 'JUMLAH');
      setCell('H44', jumlahRight?.l || 0);
      setCell('I44', jumlahRight?.p || 0);
      addMerge('G44', 'G45');
      addMerge('H44', 'H45');
      addMerge('I44', 'I45');

      // Summary sections
      for (let s = 0; s < summaries.length; s++) {
        const summary = summaries[s];
        const r = summaryStartRows[s];
        setCell(`K${r}`, summary.name);
        addMerge(`K${r}`, `L${r}`);
        setCell(`M${r}`, 'JUMLAH');
        addMerge(`M${r}`, `M${r + 1}`);
        setCell(`K${r + 1}`, 'L');
        setCell(`L${r + 1}`, 'P');
        setCell(`K${r + 2}`, summary.l);
        addMerge(`K${r + 2}`, `K${r + 3}`);
        setCell(`L${r + 2}`, summary.p);
        addMerge(`L${r + 2}`, `L${r + 3}`);
        setCell(`M${r + 2}`, summary.l + summary.p);
        addMerge(`M${r + 2}`, `M${r + 3}`);
      }

      // Signature
      setCell('G46', 'CIBUNGBULANG, .....................');
      addMerge('G46', 'I46');
      setCell('G47', 'KETUA RT.001 RW.002');
      addMerge('G47', 'I47');

      ws['!merges'] = merges;
      ws['!ref'] = 'A1:M47';
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Bulanan');

      const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      return { status: 200, data: b64, filename: `Laporan_Bulanan_${BULAN_NAMES[bulan - 1]}_${tahun}.xlsx` };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (laporanRT):", error);
    return { status: 500, error: "Terjadi kesalahan pada server" };
  }
}

// ===== Shared generator (port: generateReportData asli + fallback getJk dari GET /api/laporan) =====
async function generateReportData(bulan: number, tahun: number, whereUser: Record<string, unknown>) {
  const refDate = new Date(tahun, bulan - 1, 15);
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  const allPenduduk = await prisma.dataWarga.findMany({ where: whereUser });
  const allSementara = await prisma.pendudukSementara.findMany({ where: whereUser });
  const kejadian = await prisma.kejadian.findMany({
    where: { ...whereUser, tanggal: { gte: startDate, lte: endDate } },
  });

  let bayiL = 0, bayiP = 0;
  const leftAgeMap: Record<number, { l: number; p: number }> = {};
  for (let i = 1; i <= 38; i++) leftAgeMap[i] = { l: 0, p: 0 };
  const rightAgeMap: Record<string, { l: number; p: number }> = {};
  for (let i = 39; i <= 74; i++) rightAgeMap[String(i)] = { l: 0, p: 0 };
  rightAgeMap['75+'] = { l: 0, p: 0 };

  for (const p of allPenduduk) {
    const { umurTahun, isBayi } = hitungUmur(p.tanggalLahir, refDate);
    const isL = p.jenisKelamin === 'LAKI-LAKI';
    if (isBayi) {
      if (isL) bayiL++; else bayiP++;
    } else if (umurTahun >= 1 && umurTahun <= 38) {
      if (isL) leftAgeMap[umurTahun].l++; else leftAgeMap[umurTahun].p++;
    } else if (umurTahun >= 39 && umurTahun <= 74) {
      if (isL) rightAgeMap[String(umurTahun)].l++; else rightAgeMap[String(umurTahun)].p++;
    } else if (umurTahun >= 75) {
      if (isL) rightAgeMap['75+'].l++; else rightAgeMap['75+'].p++;
    }
  }

  const leftAges: { label: string; l: number; p: number }[] = [];
  leftAges.push({ label: '0-11 BLN', l: bayiL, p: bayiP });
  for (let i = 1; i <= 38; i++) {
    leftAges.push({ label: String(i), l: leftAgeMap[i].l, p: leftAgeMap[i].p });
  }

  let totalLeftL = 0, totalLeftP = 0;
  for (const a of leftAges) { totalLeftL += a.l; totalLeftP += a.p; }

  const rightAges: { label: string; l: number; p: number }[] = [];
  for (let i = 39; i <= 74; i++) {
    rightAges.push({ label: String(i), l: rightAgeMap[String(i)].l, p: rightAgeMap[String(i)].p });
  }
  rightAges.push({ label: '75+', l: rightAgeMap['75+'].l, p: rightAgeMap['75+'].p });
  let totalRightL = 0, totalRightP = 0;
  for (const a of rightAges) { totalRightL += a.l; totalRightP += a.p; }
  rightAges.push({ label: 'JUMLAH', l: totalRightL, p: totalRightP });

  const pendudukL = allPenduduk.filter(p => p.jenisKelamin === 'LAKI-LAKI').length;
  const pendudukP = allPenduduk.filter(p => p.jenisKelamin === 'PEREMPUAN').length;

  const wajibKTPAll = allPenduduk.filter(p => isWajibKTP(p.tanggalLahir, refDate, p.punyaKtp));
  const wajibKTPL = wajibKTPAll.filter(p => p.jenisKelamin === 'LAKI-LAKI').length;
  const wajibKTPP = wajibKTPAll.filter(p => p.jenisKelamin === 'PEREMPUAN').length;

  const kkL = allPenduduk.filter(p => p.statusKeluarga === 'KEPALA KELUARGA' && p.jenisKelamin === 'LAKI-LAKI').length;
  const kkP = allPenduduk.filter(p => p.statusKeluarga === 'KEPALA KELUARGA' && p.jenisKelamin === 'PEREMPUAN').length;

  const activeSementara = allSementara.filter(p => {
    if (!p.tanggalKeluar) return p.tanggalMasuk <= endDate;
    return p.tanggalMasuk <= endDate && p.tanggalKeluar >= startDate;
  });
  const sementaraL = activeSementara.filter(p => p.jenisKelamin === 'LAKI-LAKI').length;
  const sementaraP = activeSementara.filter(p => p.jenisKelamin === 'PEREMPUAN').length;

  // Fallback jenis kelamin kejadian via NIK (dari GET /api/laporan asli)
  const emptyGenderKejadian = kejadian.filter(k => !k.jenisKelamin && k.nik);
  const nikList = [...new Set(emptyGenderKejadian.map(k => k.nik!))];
  const genderLookup: Record<string, string> = {};
  if (nikList.length > 0) {
    const pendudukList = await prisma.dataWarga.findMany({
      where: { nik: { in: nikList } },
      select: { nik: true, jenisKelamin: true },
    });
    for (const p of pendudukList) genderLookup[p.nik] = p.jenisKelamin;
  }
  const getJk = (k: { jenisKelamin: string; nik: string | null }): string => {
    if (k.jenisKelamin === 'LAKI-LAKI' || k.jenisKelamin === 'PEREMPUAN') return k.jenisKelamin;
    if (k.nik && genderLookup[k.nik]) return genderLookup[k.nik];
    return '';
  };

  const kejadianSummary: Record<string, { l: number; p: number }> = {};
  for (const type of ['LAHIR', 'MATI', 'PINDAH', 'DATANG']) {
    const filtered = kejadian.filter(k => k.jenisKejadian === type);
    kejadianSummary[type] = {
      l: filtered.filter(k => getJk(k) === 'LAKI-LAKI').length,
      p: filtered.filter(k => getJk(k) === 'PEREMPUAN').length,
    };
  }

  return {
    bulan,
    tahun,
    leftAges,
    rightAges,
    totalLeftL,
    totalLeftP,
    summary: {
      penduduk: { l: pendudukL, p: pendudukP },
      wajibKTP: { l: wajibKTPL, p: wajibKTPP },
      kartuKeluarga: { l: kkL, p: kkP },
      pendudukSementara: { l: sementaraL, p: sementaraP },
      lahir: kejadianSummary['LAHIR'],
      mati: kejadianSummary['MATI'],
      pindah: kejadianSummary['PINDAH'],
      datang: kejadianSummary['DATANG'],
    },
  };
}
