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

export async function sembakoRTAction(operation: string, payload?: unknown) {
  try {
    const session = await getSession();
    const isStaff = session.user.role === "ADMIN" || session.user.role === "PETUGAS";
    const me = await prisma.user.findUnique({ where: { userId: session.user.userId }, select: { noRt: true, noRw: true } });
    const whereUser = isStaff ? {} : { userId: session.user.userId };

    // ===== LIST =====
    if (operation === "list") {
      const { filterRt, filterRw } = (payload ?? {}) as { filterRt?: string; filterRw?: string };
      // ADMIN/PETUGAS: bebas memilih wilayah (kosong = Semua RT/RW). Role lain: TERKUNCI di level server ke wilayah RT-nya.
      const where: Record<string, unknown> =
        isStaff
          ? {}
          : me?.noRt && me?.noRw
            ? { noRt: me.noRt, noRw: me.noRw }
            : { userId: session.user.userId };
      if (isStaff) {
        if (filterRt && filterRt !== "SEMUA") where.noRt = String(filterRt);
        if (filterRw && filterRw !== "SEMUA") where.noRw = String(filterRw);
      }
      const data = await prisma.penerimaSembako.findMany({ where, orderBy: { namaLengkap: "asc" } });
      return { status: 200, data };
    }

    // ===== ADD =====
    if (operation === "add") {
      const d = (payload ?? {}) as Record<string, unknown>;
      const noKk = String(d.noKk ?? d.noKK ?? "");
      const nik = String(d.nik ?? "");
      if (!noKk || noKk.length !== 16) throw new ApiError(status.BAD_REQUEST, "No. KK harus 16 digit angka");
      if (!nik || nik.length !== 16) throw new ApiError(status.BAD_REQUEST, "NIK harus 16 digit angka");
      if (!d.namaLengkap) throw new ApiError(status.BAD_REQUEST, "Nama Lengkap wajib diisi");
      const dup = await prisma.penerimaSembako.findFirst({ where: { nik } });
      if (dup) throw new ApiError(status.BAD_REQUEST, "NIK sudah terdaftar sebagai penerima sembako");

      const me = await prisma.user.findUnique({ where: { userId: session.user.userId }, select: { noRt: true, noRw: true } });
      const data = await prisma.penerimaSembako.create({
        data: {
          userId: session.user.userId,
          noKk, nik,
          namaLengkap: toUpperCase(String(d.namaLengkap)),
          jenisKelamin: toUpperCase(String(d.jenisKelamin ?? "")),
          statusKeluarga: toUpperCase(String(d.statusKeluarga ?? "")),
          tanggalLahir: String(d.tanggalLahir ?? ""),
          alamat: toUpperCase(String(d.alamat ?? "KP. CEMPLANG")),
          noRt: me?.noRt ?? "001", noRw: me?.noRw ?? "002",
          keterangan: (d.keterangan as string) || null,
        },
      });
      revalidatePath("/data-warga");
      return { status: 200, message: "Penerima sembako berhasil ditambahkan", data };
    }

    // ===== DELETE =====
    if (operation === "delete") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const existing = await prisma.penerimaSembako.findUnique({ where: { penerimaSembakoId: Number(id) } });
      if (!existing) throw new ApiError(status.NOT_FOUND, "Data tidak ditemukan.");
      const bolehKelola = isStaff || existing.userId === session.user.userId || (!!me?.noRt && !!me?.noRw && existing.noRt === me.noRt && existing.noRw === me.noRw);
      if (!bolehKelola) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      await prisma.penerimaSembako.delete({ where: { penerimaSembakoId: Number(id) } });
      revalidatePath("/data-warga");
      return { status: 200, message: "Data penerima sembako berhasil dihapus" };
    }

    // ===== DELETE ALL =====
    if (operation === "deleteAll") {
      const { konfirmasi } = (payload ?? {}) as { konfirmasi?: string };
      if (konfirmasi !== "HAPUS") throw new ApiError(status.BAD_REQUEST, "Ketik HAPUS untuk konfirmasi.");
      const where = isStaff ? {} : { userId: session.user.userId };
      const jumlah = await prisma.penerimaSembako.count({ where });
      await prisma.penerimaSembako.deleteMany({ where });
      revalidatePath("/data-warga");
      return { status: 200, message: `Semua data penerima sembako berhasil dihapus (${jumlah} data)` };
    }

    // ===== SNAPSHOT: LIST =====
    if (operation === "snapshotList") {
      const snapshots = await prisma.sembakoSnapshot.findMany({ where: whereUser, orderBy: { createdAt: "desc" } });
      const data = snapshots.map(s => ({
        id: s.sembakoSnapshotId,
        nama: s.nama,
        jumlahPenerima: s.jumlahPenerima,
        createdAt: s.createdAt,
      }));
      return { status: 200, data };
    }

    // ===== SNAPSHOT: SAVE =====
    if (operation === "snapshotSave") {
      const { nama, data: dataPenerima } = (payload ?? {}) as { nama?: string; data?: Array<Record<string, unknown>> };
      if (!dataPenerima || dataPenerima.length === 0) throw new ApiError(status.BAD_REQUEST, "Tidak ada data penerima untuk disimpan");
      const jumlah = dataPenerima.length;
      const data = await prisma.sembakoSnapshot.create({
        data: {
          userId: session.user.userId,
          nama: String(nama || "Penerima Sembako"),
          jumlahPenerima: jumlah,
          data: JSON.stringify(dataPenerima),
        },
      });
      return { status: 200, message: "Snapshot tersimpan", data };
    }

    // ===== SNAPSHOT: LOAD =====
    if (operation === "snapshotLoad") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const snap = await prisma.sembakoSnapshot.findUnique({ where: { sembakoSnapshotId: Number(id) } });
      if (!snap) throw new ApiError(status.NOT_FOUND, "Snapshot tidak ditemukan.");
      if (!isStaff && snap.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      return { status: 200, data: { id: snap.sembakoSnapshotId, nama: snap.nama, jumlahPenerima: snap.jumlahPenerima, data: JSON.parse(snap.data || "[]"), createdAt: snap.createdAt } };
    }

    // ===== SNAPSHOT: DELETE =====
    if (operation === "snapshotDelete") {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) throw new ApiError(status.BAD_REQUEST, "ID diperlukan");
      const snap = await prisma.sembakoSnapshot.findUnique({ where: { sembakoSnapshotId: Number(id) } });
      if (!snap) throw new ApiError(status.NOT_FOUND, "Snapshot tidak ditemukan.");
      if (!isStaff && snap.userId !== session.user.userId) throw new ApiError(status.FORBIDDEN, "Akses ditolak.");
      await prisma.sembakoSnapshot.delete({ where: { sembakoSnapshotId: Number(id) } });
      return { status: 200, message: "Snapshot berhasil dihapus" };
    }

    return { status: 400, error: "Operasi tidak dikenal" };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    console.error("ERROR ASLI (sembakoRT):", error);
    return { status: 500, error: "Terjadi kesalahan pada server." };
  }
}

import { toUpperCase } from "../utils/kependudukan";
