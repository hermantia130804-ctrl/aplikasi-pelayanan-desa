"use server";

import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { prisma } from "@/lib/prisma";
import { MESSAGE } from "@/constants/message";
import { errorHandler } from "../services/error";
import { findCurrentSessionService } from "../services/session";
import { createDataWargaSchema, updateDataWargaSchema } from "@/lib/validators/data-warga";

const requireSession = async () => {
  const session = await findCurrentSessionService();
  if (!session?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  return session;
};

// Ambil profil lengkap (noRt/noRw/jabatan) untuk pengecekan wilayah & kasi pemerintahan.
const getMe = async (userId: string) => {
  return prisma.user.findUnique({
    where: { userId },
    select: { noRt: true, noRw: true, jabatan: true },
  });
};

// Boleh TAMBAH/EDIT data warga: ADMIN, RT, atau PETUGAS dengan jabatan "Kasi Pemerintahan".
// Petugas lain (Kasi Kesejahteraan / Kasi Pelayanan / Global) TIDAK boleh ubah/tambah.
const bolehKelola = (role: string, jabatan: string | null | undefined) =>
  role === "ADMIN" ||
  role === "RT" ||
  (role === "PETUGAS" && jabatan === "Kasi Pemerintahan");

// Boleh HAPUS: ADMIN (semua), Kasi Pemerintahan (semua), RT (wilayah cocok).
const bolehHapus = (role: string, jabatan: string | null | undefined) =>
  role === "ADMIN" || (role === "PETUGAS" && jabatan === "Kasi Pemerintahan");

// ===== Daftar warga:
//   ADMIN / PETUGAS -> semua data (petugas non-kasi = read-only).
//   RT -> hanya warga di RT-nya (noRt/noRw cocok), bukan hanya buatan sendiri.
//   USER -> hanya buatan sendiri.
export const findManyDataWargaAction = async () => {
  try {
    const session = await requireSession();
    const role = session.user.role;
    let where: Record<string, unknown> = {};
    if (role === "ADMIN" || role === "PETUGAS") {
      where = {};
    } else if (role === "RT") {
      const me = await getMe(session.user.userId);
      if (!me?.noRt || !me.noRw) {
        return { status: status.OK, data: [] };
      }
      where = { noRt: me.noRt, noRw: me.noRw };
    } else {
      where = { userId: session.user.userId };
    }
    const data = await prisma.dataWarga.findMany({
      where,
      orderBy: [{ noRt: "asc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true, noRt: true, noRw: true } } },
    });
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Detail (staff / RT wilayah cocok / pemilik)
export const findDataWargaByIdAction = async (id: string) => {
  try {
    const session = await requireSession();
    const data = await prisma.dataWarga.findUnique({
      where: { dataWargaId: id },
      include: { user: { select: { name: true } } },
    });
    if (!data) throw new ApiError(status.NOT_FOUND, "Data warga tidak ditemukan.");
    const role = session.user.role;
    if (role === "ADMIN" || role === "PETUGAS") {
      // staff: boleh lihat semua (petugas non-kasi = read-only).
    } else if (role === "RT") {
      const me = await getMe(session.user.userId);
      const wilayahCocok = !!(me?.noRt && me.noRw && data.noRt === me.noRt && data.noRw === me.noRw);
      if (!wilayahCocok && data.userId !== session.user.userId) {
        throw new ApiError(status.FORBIDDEN, "Tidak berhak.");
      }
    } else if (data.userId !== session.user.userId) {
      throw new ApiError(status.FORBIDDEN, "Tidak berhak.");
    }
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Tambah: ADMIN, RT, atau PETUGAS (Kasi Pemerintahan).
//   RT -> noRt/noRw otomatis dari profil (tidak bisa pilih wilayah lain).
//   ADMIN / Kasi -> noRt/noRw dari input form (bisa input warga RT mana pun).
export const createDataWargaAction = async (payload: unknown) => {
  try {
    const session = await requireSession();
    const role = session.user.role;
    const me = await getMe(session.user.userId);
    if (!bolehKelola(role, me?.jabatan)) {
      throw new ApiError(status.FORBIDDEN, "Anda tidak berhak menambah data warga.");
    }
    const parsed = createDataWargaSchema.parse(payload);
    const raw = (payload as Record<string, unknown>) ?? {};

    let noRt: string;
    let noRw: string;
    if (role === "RT") {
      if (!me?.noRt || !me.noRw) {
        throw new ApiError(status.BAD_REQUEST, "Akun RT belum memiliki data wilayah (No RT/RW). Hubungi admin.");
      }
      noRt = me.noRt;
      noRw = me.noRw;
    } else {
      // ADMIN / Kasi: ambil RT/RW dari input form.
      noRt = String(raw.noRt ?? "").trim();
      noRw = String(raw.noRw ?? "").trim();
      if (!noRt || !noRw) {
        throw new ApiError(status.BAD_REQUEST, "RT dan RW wajib diisi.");
      }
    }

    const data = await prisma.dataWarga.create({
      data: {
        ...parsed,
        userId: session.user.userId,
        noRt,
        noRw,
      },
    });

    revalidatePath("/data-warga");
    revalidatePath("/kelola-data-warga");
    return { status: status.OK, message: "Data warga berhasil disimpan", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Edit: ADMIN, Kasi Pemerintahan, RT (wilayah cocok), atau pemilik data.
//   Petugas non-kasi DIBLOKIR (read-only).
//   ADMIN / Kasi boleh ubah RT/RW; RT tidak (wilayahnya tetap).
export const updateDataWargaAction = async (id: string, payload: unknown) => {
  try {
    const session = await requireSession();
    const parsed = updateDataWargaSchema.parse(payload);

    const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: id } });
    if (!existing) throw new ApiError(status.NOT_FOUND, "Data warga tidak ditemukan.");
    const role = session.user.role;
    const me = await getMe(session.user.userId);

    const wilayahCocok = !!(role === "RT" && me?.noRt && me.noRw && existing.noRt === me.noRt && existing.noRw === me.noRw);
    const boleh =
      role === "ADMIN" ||
      (role === "PETUGAS" && me?.jabatan === "Kasi Pemerintahan") ||
      existing.userId === session.user.userId ||
      wilayahCocok;
    if (!boleh) {
      throw new ApiError(status.FORBIDDEN, "Tidak berhak mengubah data ini.");
    }

    const raw = (payload as Record<string, unknown>) ?? {};
    const isAdminAtauKasi =
      role === "ADMIN" || (role === "PETUGAS" && me?.jabatan === "Kasi Pemerintahan");
    const data = await prisma.dataWarga.update({
      where: { dataWargaId: id },
      data: {
        ...parsed,
        ...(isAdminAtauKasi
          ? {
              noRt: String(raw.noRt ?? "").trim() || undefined,
              noRw: String(raw.noRw ?? "").trim() || undefined,
            }
          : {}),
      },
    });
    revalidatePath("/data-warga");
    revalidatePath("/kelola-data-warga");
    return { status: status.OK, message: "Data warga berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};

// ===== Hapus: ADMIN (semua), Kasi Pemerintahan (semua), RT (wilayah cocok).
//   Petugas non-kasi DIBLOKIR.
export const deleteDataWargaAction = async (id: string) => {
  try {
    const session = await requireSession();
    const existing = await prisma.dataWarga.findUnique({ where: { dataWargaId: id } });
    if (!existing) throw new ApiError(status.NOT_FOUND, "Data warga tidak ditemukan.");
    const role = session.user.role;
    const me = await getMe(session.user.userId);

    const wilayahCocok = !!(role === "RT" && me?.noRt && me.noRw && existing.noRt === me.noRt && existing.noRw === me.noRw);
    const boleh = bolehHapus(role, me?.jabatan) || wilayahCocok;
    if (!boleh) {
      throw new ApiError(status.FORBIDDEN, "Tidak berhak menghapus.");
    }

    await prisma.dataWarga.delete({ where: { dataWargaId: id } });
    revalidatePath("/data-warga");
    revalidatePath("/kelola-data-warga");
    return { status: status.OK, message: "Data warga berhasil dihapus" };
  } catch (error) {
    return errorHandler(error);
  }
};
