"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

export async function suratPengantarRTAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";

    // ===== LIST (port: GET /api/surat-pengantar) =====
    if (operation === "list") {
      const { filterRt, filterRw } = (payload ?? {}) as { filterRt?: string; filterRw?: string };
      // Tabel SuratPengantar tidak punya kolom RT/RW. Untuk filter admin, cari NIK di DataWarga
      // yang cocok dengan RT/RW, lalu batasi surat yang NIK-nya ada di set itu.
      let data = await prisma.suratPengantar.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (filterRt && filterRt !== "SEMUA") {
        const nikList = await prisma.dataWarga.findMany({
          where: { noRt: String(filterRt), ...(filterRw && filterRw !== "SEMUA" ? { noRw: String(filterRw) } : {}) },
          select: { nik: true },
        });
        const nikSet = new Set(nikList.map(n => n.nik));
        data = data.filter(s => nikSet.has(s.nik));
      }
      // FIX #2: Non-staff (RT/USER) hanya lihat surat pengantar milik RT-nya sendiri (via NIK lookup)
      if (!isStaff) {
        const me = await prisma.user.findUnique({ where: { userId: session.user.userId }, select: { noRt: true, noRw: true } });
        if (me?.noRt && me?.noRw) {
          const nikList = await prisma.dataWarga.findMany({
            where: { noRt: me.noRt, noRw: me.noRw },
            select: { nik: true },
          });
          const nikSet = new Set(nikList.map(n => n.nik));
          data = data.filter(s => nikSet.has(s.nik));
        } else {
          data = []; // RT tanpa wilayah -> tidak lihat apapun
        }
      }
      return { status: 200, data };
    }

    // ===== CREATE (port: POST /api/surat-pengantar) =====
    if (operation === "create") {
      const { rtId, nomorSurat, namaPemohon, nik, tujuan, keterangan, ketuaRW } =
        (payload ?? {}) as Record<string, string | number | undefined>;

      if (!nomorSurat || !namaPemohon || !nik || !tujuan) {
        throw new ApiError(status.BAD_REQUEST, "Nomor surat, nama pemohon, NIK, dan tujuan wajib diisi");
      }

      // FIX multi-RT Skema B (noRt bisa berulang per RW): turunkan rtId dari GABUNGAN
      // noRt + noRw supaya unik per kombinasi RT/RW.
      //   RT.001/RW.001 -> 101, RT.001/RW.002 -> 102, RT.002/RW.001 -> 201, dst.
      // Tidak ada perubahan schema; hanya cara isi rtId yang berubah.
      const session = await getSession();
      const me = await prisma.user.findUnique({ where: { userId: session.user.userId }, select: { noRt: true, noRw: true } });
      const parseNum = (v: string | null | undefined): number => {
        const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10);
        return isNaN(n) ? 0 : n;
      };
      const rtNum = parseNum(me?.noRt);
      const rwNum = parseNum(me?.noRw);
      const rtIdEfektif = typeof rtId === "number" && rtId > 0
        ? rtId
        : ((rtNum * 100 + rwNum) || 1);

      const surat = await prisma.suratPengantar.create({
        data: {
          rtId: rtIdEfektif,
          nomorSurat: String(nomorSurat).trim().toUpperCase(),
          namaPemohon: String(namaPemohon).trim().toUpperCase(),
          nik: String(nik).trim(),
          tujuan: String(tujuan).trim().toUpperCase(),
          keterangan: keterangan ? String(keterangan).trim().toUpperCase() : null,
          ketuaRW: ketuaRW ? String(ketuaRW).trim().toUpperCase() : null,
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, data: surat };
    }

    // ===== UPDATE (port: PUT /api/surat-pengantar) =====
    if (operation === "update") {
      const { id, nomorSurat, namaPemohon, nik, tujuan, keterangan, ketuaRW } =
        (payload ?? {}) as Record<string, string | number | undefined>;

      if (!id) throw new ApiError(status.BAD_REQUEST, "ID surat wajib");

      const surat = await prisma.suratPengantar.update({
        where: { id: Number(id) },
        data: {
          ...(nomorSurat ? { nomorSurat: String(nomorSurat).trim().toUpperCase() } : {}),
          ...(namaPemohon ? { namaPemohon: String(namaPemohon).trim().toUpperCase() } : {}),
          ...(nik ? { nik: String(nik).trim() } : {}),
          ...(tujuan ? { tujuan: String(tujuan).trim().toUpperCase() } : {}),
          ...(keterangan !== undefined
            ? { keterangan: keterangan ? String(keterangan).trim().toUpperCase() : null }
            : {}),
          ...(ketuaRW !== undefined
            ? { ketuaRW: ketuaRW ? String(ketuaRW).trim().toUpperCase() : null }
            : {}),
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, data: surat };
    }

    // ===== DELETE (port: DELETE /api/surat-pengantar?id=) =====
    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: number };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID surat wajib");
      await prisma.suratPengantar.delete({ where: { id: Number(id) } });
      revalidatePath("/data-warga");
      return { status: 200, message: "Surat pengantar berhasil dihapus" };
    }

    // ===== DELETE ALL (konfirmasi ketik HAPUS; filter via NIK lookup) =====
    // Tabel SuratPengantar tidak punya kolom RT/RW -> filter admin lewat NIK yang
    // terdaftar di DataWarga pada RT/RW terpilih. Tanpa filter -> hapus SEMUA.
    if (operation === "deleteAll") {
      const session = await getSession();
      const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
      if (!isStaff) throw new ApiError(status.FORBIDDEN, "Hanya Admin/Petugas yang dapat reset data surat pengantar.");
      const { konfirmasi, filterRt, filterRw } = (payload ?? {}) as { konfirmasi?: string; filterRt?: string; filterRw?: string };
      if (konfirmasi !== "HAPUS") throw new ApiError(status.BAD_REQUEST, "Ketik HAPUS untuk konfirmasi.");
      let where: Record<string, unknown> = {};
      if (filterRt && filterRt !== "SEMUA") {
        const nikList = await prisma.dataWarga.findMany({
          where: { noRt: String(filterRt), ...(filterRw && filterRw !== "SEMUA" ? { noRw: String(filterRw) } : {}) },
          select: { nik: true },
        });
        where = { nik: { in: nikList.map(n => n.nik) } };
      }
      const jumlah = await prisma.suratPengantar.count({ where });
      await prisma.suratPengantar.deleteMany({ where });
      revalidatePath("/data-warga");
      return { status: 200, message: `Data surat pengantar berhasil dihapus (${jumlah} surat)`, jumlah };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (suratPengantarRT):", error);
    return { status: 500, error: "Gagal memproses surat pengantar" };
  }
}
