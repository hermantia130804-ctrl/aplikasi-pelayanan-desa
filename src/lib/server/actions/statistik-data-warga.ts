"use server";

import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { hitungUmur, isWajibKTP, formatTanggal } from "../utils/kependudukan";

export async function getStatistikDataWarga(filterRt?: string, filterRw?: string) {
  const session = await findCurrentSessionService();
  if (!session?.user) return null;

  const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
  const whereUser = isStaff ? {} : { userId: session.user.userId };

  // Role RT: statistik terkunci ke wilayah RT-nya (kolom no_rt/no_rw), bukan hanya data yang ia buat sendiri
  const me = await prisma.user.findUnique({ where: { userId: session.user.userId }, select: { noRt: true, noRw: true } });
  const wilayahWhere: Record<string, unknown> =
    !isStaff && me?.noRt && me?.noRw
      ? { noRt: me.noRt, noRw: me.noRw }
      : { ...whereUser };

  // ADMIN/PETUGAS: terapkan filter RT/RW yang dipilih di dropdown global (jika bukan SEMUA)
  if (isStaff) {
    if (filterRt && filterRt !== "SEMUA") wilayahWhere.noRt = String(filterRt);
    if (filterRw && filterRw !== "SEMUA") wilayahWhere.noRw = String(filterRw);
  }

  const allPenduduk = await prisma.dataWarga.findMany({ where: wilayahWhere });
  const allSementara = await prisma.pendudukSementara.findMany({
    where: { ...wilayahWhere, tanggalKeluar: null },
  });

  // Kejadian: tabel tidak punya kolom RT, jadi difilter via No. KK milik RT (untuk RT lock),
  // atau via filterRt/filterRw staff (lookup KK dari DataWarga + PendudukSementara).
  const kkWilayahSet = new Set<string>();
  if (Object.keys(wilayahWhere).length > 0 && (wilayahWhere.noRt || wilayahWhere.noRw)) {
    const [kkTetap, kkSem] = await Promise.all([
      prisma.dataWarga.findMany({ where: { noRt: wilayahWhere.noRt as string, noRw: wilayahWhere.noRw as string }, select: { noKk: true }, distinct: ["noKk"] }),
      prisma.pendudukSementara.findMany({ where: { noRt: wilayahWhere.noRt as string, noRw: wilayahWhere.noRw as string }, select: { noKk: true }, distinct: ["noKk"] }),
    ]);
    for (const k of [...kkTetap, ...kkSem]) if (k.noKk) kkWilayahSet.add(k.noKk);
  }
  const kejadianWhere: Record<string, unknown> = isStaff
    ? (kkWilayahSet.size > 0 ? { noKk: { in: Array.from(kkWilayahSet) } } : {})
    : (kkWilayahSet.size > 0
        ? { OR: [{ userId: session.user.userId }, { noKk: { in: Array.from(kkWilayahSet) } }] }
        : { userId: session.user.userId });

  const kkMap = new Set(allPenduduk.map(p => p.noKk));
  const totalKK = kkMap.size;
  const pendudukL = allPenduduk.filter(p => p.jenisKelamin === "LAKI-LAKI").length;
  const pendudukP = allPenduduk.length - pendudukL;

  const ageDist: Record<string, { l: number; p: number }> = {};
  for (const p of allPenduduk) {
    const { label } = hitungUmur(p.tanggalLahir);
    if (!ageDist[label]) ageDist[label] = { l: 0, p: 0 };
    if (p.jenisKelamin === "LAKI-LAKI") ageDist[label].l++;
    else ageDist[label].p++;
  }
  const bayiL = ageDist["0-11 BLN"]?.l || 0;
  const bayiP = ageDist["0-11 BLN"]?.p || 0;

  const dpt = allPenduduk.filter(p => hitungUmur(p.tanggalLahir).umurTahun >= 17);
  const dptL = dpt.filter(p => p.jenisKelamin === "LAKI-LAKI").length;
  const dptP = dpt.length - dptL;

  const wajibKTP = allPenduduk.filter(p => isWajibKTP(p.tanggalLahir, undefined, p.punyaKtp));
  const wajibKTPL = wajibKTP.filter(p => p.jenisKelamin === "LAKI-LAKI").length;
  const wajibKTPP = wajibKTP.length - wajibKTPL;
  const wajibKTPList = wajibKTP.map(p => ({
    dataWargaId: p.dataWargaId,
    noKk: p.noKk,
    nik: p.nik,
    namaLengkap: p.namaLengkap,
    jenisKelamin: p.jenisKelamin,
    tempatLahir: p.tempatLahir,
    tanggalLahir: formatTanggal(p.tanggalLahir),
    statusKeluarga: p.statusKeluarga,
    punyaKtp: p.punyaKtp,
  }));

  const kkL = allPenduduk.filter(p => p.statusKeluarga === "KEPALA KELUARGA" && p.jenisKelamin === "LAKI-LAKI").length;
  const kkP = allPenduduk.filter(p => p.statusKeluarga === "KEPALA KELUARGA" && p.jenisKelamin === "PEREMPUAN").length;

  const sementaraL = allSementara.filter(p => p.jenisKelamin === "LAKI-LAKI").length;
  const sementaraP = allSementara.length - sementaraL;
  const sementaraKK = new Set(allSementara.map(p => p.noKk)).size;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const kejadianBulanIni = await prisma.kejadian.findMany({
    where: { ...kejadianWhere, tanggal: { gte: startDate, lte: endDate } },
  });

  const kejadianCounts: Record<string, { l: number; p: number }> = {};
  for (const type of ["LAHIR", "MATI", "PINDAH", "DATANG"]) {
    const filtered = kejadianBulanIni.filter(k => k.jenisKejadian === type);
    kejadianCounts[type] = {
      l: filtered.filter(k => k.jenisKelamin === "LAKI-LAKI").length,
      p: filtered.filter(k => k.jenisKelamin === "PEREMPUAN").length,
    };
  }

  return {
    totalKK, totalPenduduk: allPenduduk.length, pendudukL, pendudukP,
    bayiL, bayiP, dptL, dptP, ageDist,
    wajibKTPL, wajibKTPP, wajibKTPList,
    kkL, kkP, sementaraKK, sementaraL, sementaraP, kejadianCounts,
  };
}
