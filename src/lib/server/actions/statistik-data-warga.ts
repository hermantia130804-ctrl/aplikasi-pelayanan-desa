"use server";

import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { hitungUmur, isWajibKTP, formatTanggal } from "../utils/kependudukan";

export async function getStatistikDataWarga() {
  const session = await findCurrentSessionService();
  if (!session?.user) return null;

  const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
  const whereUser = isStaff ? {} : { userId: session.user.userId };

  const allPenduduk = await prisma.dataWarga.findMany({ where: whereUser });
  const allSementara = await prisma.pendudukSementara.findMany({
    where: { ...whereUser, tanggalKeluar: null },
  });

  const kkMap = new Set(allPenduduk.map(p => p.noKK));
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
    where: { ...whereUser, tanggal: { gte: startDate, lte: endDate } },
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
