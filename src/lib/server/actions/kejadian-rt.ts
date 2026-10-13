"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { toUpperCase } from "../utils/kependudukan";

const getSession = async () => {
  const s = await findCurrentSessionService();
  if (!s?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return s;
};

const staffOnly = async () => {
  const s = await getSession();
  if (s.user.role !== "ADMIN" && s.user.role !== "PETUGAS") {
    throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat mengakses.");
  }
  return s;
};

export async function kejadianRTAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const whereUser = isStaff ? {} : { userId: session.user.userId };
    const me = await prisma.user.findUnique({ where: { userId: session.user.userId } });

    // ===== LIST (per jenis + bulan/tahun) =====
    if (operation === "list") {
      const { jenis, bulan, tahun } = (payload ?? {}) as { jenis?: string; bulan?: string; tahun?: string };
      const where: Record<string, unknown> = { ...whereUser };
      if (jenis) where.jenisKejadian = jenis;
      if (bulan && tahun) {
        const startDate = new Date(parseInt(tahun), parseInt(bulan) - 1, 1);
        const endDate = new Date(parseInt(tahun), parseInt(bulan), 0, 23, 59, 59);
        where.tanggal = { gte: startDate, lte: endDate };
      }
      const data = await prisma.kejadian.findMany({ where, orderBy: { tanggal: "desc" } });
      return { status: 200, data };
    }

    // ===== CREATE (dengan side effects ke penduduk) =====
    if (operation === "create") {
      const d = (payload ?? {}) as Record<string, unknown>;
      const jenis = toUpperCase(String(d.jenisKejadian ?? ""));
      const noKK = String(d.noKK ?? "");
      const nik = String(d.nik ?? "");
      const namaLengkap = String(d.namaLengkap ?? "");
      const tanggalStr = String(d.tanggal ?? "");
      if (!jenis || !namaLengkap || !tanggalStr) {
        throw new ApiError(status.BAD_REQUEST, "Jenis kejadian, nama, dan tanggal wajib diisi.");
      }
      const tanggal = new Date(tanggalStr);

      // --- Side effect per jenis ---
      if (jenis === "MATI" && nik) {
        await prisma.dataWarga.deleteMany({ where: { nik } });
      }
      if (jenis === "LAHIR" && nik && namaLengkap) {
        const finalNoKK = String(d.noKKBaru ?? "") || noKK;
        let namaAyah = "-", namaIbu = "-";
        if (finalNoKK) {
          const kkHead = await prisma.dataWarga.findFirst({ where: { noKk: finalNoKK, statusKeluarga: "KEPALA KELUARGA" } });
          if (kkHead) namaAyah = kkHead.namaLengkap || "-";
          const istri = await prisma.dataWarga.findFirst({ where: { noKk: finalNoKK, jenisKelamin: "PEREMPUAN" } });
          if (istri) namaIbu = istri.namaLengkap || "-";
        }
        const sudahAda = await prisma.dataWarga.findUnique({ where: { nik } });
        if (!sudahAda) {
          await prisma.dataWarga.create({
            data: {
              userId: session.user.userId, noKk: finalNoKK, nik,
              namaLengkap: toUpperCase(namaLengkap),
              jenisKelamin: toUpperCase(String(d.jenisKelamin ?? "")) || "LAKI-LAKI",
              statusKeluarga: "ANAK",
              tempatLahir: toUpperCase(String(d.tempatLahir ?? "-")),
              tanggalLahir: d.tanggalLahir ? new Date(String(d.tanggalLahir)) : tanggal,
              agama: "ISLAM", pendidikan: "TIDAK/BELUM SEKOLAH",
              pekerjaan: "BELUM/TIDAK BEKERJA", statusPerkawinan: "BELUM MENIKAH",
              namaAyah, namaIbu, punyaKtp: "BELUM",
              noRt: me?.noRt ?? "001", noRw: me?.noRw ?? "002",
            },
          });
        }
      }
      if (jenis === "PINDAH" && nik) {
        await prisma.dataWarga.deleteMany({ where: { nik } });
      }
      if (jenis === "DATANG") {
        const anggotaBaru = (d.anggotaBaru ?? []) as Array<Record<string, unknown>>;
        const finalNoKK = String(d.noKKBaru ?? "") || noKK;
        for (const a of anggotaBaru) {
          if (!a.nik || !a.namaLengkap) continue;
          const sudahAda = await prisma.dataWarga.findUnique({ where: { nik: String(a.nik) } });
          if (sudahAda) continue;
          await prisma.dataWarga.create({
            data: {
              userId: session.user.userId, noKk: finalNoKK,
              nik: String(a.nik), namaLengkap: toUpperCase(String(a.namaLengkap)),
              jenisKelamin: toUpperCase(String(a.jenisKelamin ?? "")) || "LAKI-LAKI",
              statusKeluarga: toUpperCase(String(a.statusKeluarga ?? "")) || "LAINNYA",
              tempatLahir: toUpperCase(String(a.tempatLahir ?? "-")),
              tanggalLahir: a.tanggalLahir ? new Date(String(a.tanggalLahir)) : tanggal,
              agama: toUpperCase(String(a.agama ?? "")) || "ISLAM",
              pendidikan: toUpperCase(String(a.pendidikan ?? "")) || "TIDAK/BELUM SEKOLAH",
              pekerjaan: toUpperCase(String(a.pekerjaan ?? "")) || "BELUM/TIDAK BEKERJA",
              statusPerkawinan: toUpperCase(String(a.statusPerkawinan ?? "")) || "BELUM MENIKAH",
              namaAyah: toUpperCase(String(a.namaAyah ?? "")) || "-",
              namaIbu: toUpperCase(String(a.namaIbu ?? "")) || "-",
              punyaKtp: String(a.punyaKtp ?? "BELUM"),
              noRt: me?.noRt ?? "001", noRw: me?.noRw ?? "002",
            },
          });
        }
      }

      // Simpan catatan kejadian
      const data = await prisma.kejadian.create({
        data: {
          userId: session.user.userId,
          jenisKejadian: jenis,
          noKk: String(d.noKKBaru ?? "") || noKK || "",
          namaLengkap: toUpperCase(namaLengkap),
          nik: nik || null,
          jenisKelamin: toUpperCase(String(d.jenisKelamin ?? "")) || "",
          tanggal,
          keterangan: (d.keterangan as string) || null,
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, message: `Kejadian ${jenis} berhasil dicatat`, data };
    }

    // ===== UPDATE (catatan saja) =====
    if (operation === "update") {
      const { id, ...d } = (payload ?? {}) as Record<string, unknown>;
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.kejadian.findUnique({ where: { kejadianId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Kejadian tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      const u: Record<string, unknown> = {};
      if (d.keterangan !== undefined) u.keterangan = (d.keterangan as string) || null;
      if (d.tanggal !== undefined) u.tanggal = new Date(String(d.tanggal));
      const data = await prisma.kejadian.update({ where: { kejadianId: String(id) }, data: u });
      revalidatePath("/data-warga");
      return { status: 200, message: "Kejadian berhasil diupdate", data };
    }

    // ===== DELETE =====
    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.kejadian.findUnique({ where: { kejadianId: String(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Kejadian tidak ditemukan.");
      if (!isStaff && existing.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      await prisma.kejadian.delete({ where: { kejadianId: String(id) } });
      revalidatePath("/data-warga");
      return { status: 200, message: "Kejadian berhasil dihapus" };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (kejadianRT):", error);
    return { status: 500, error: "Terjadi kesalahan pada server." };
  }
}
