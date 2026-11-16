"use server";

import { MESSAGE } from "@/constants/message";
import { PATHS } from "@/constants/paths";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { createPermohonanPindahService, deletePermohonanPindahService, findPermohonanPindahByIdService, followUpPermohonanPindahService, updatePermohonanPindahService } from "@/lib/server/services/permohonan-pindah";
import { errorHandler } from "@/lib/server/services/error";
import { TCreatePermohonanPindahSchema, TFollowUpPermohonanPindahSchema, TUpdatePermohonanPindahSchema } from "@/lib/validators/permohonan-pindah";
import { ApiError } from "next/dist/server/api-utils";
import { revalidatePath } from "next/cache";
import status from "http-status";

// ===== Helper izin kelola untuk permohonan pindah (#4) =====
// Kembalikan record existing + validasi izin. Izin kelola jika:
//   - staff (ADMIN/PETUGAS), ATAU
//   - pemilik permohonan (userId cocok).
// Tambahan: update/delete hanya boleh jika status masih DIAJUKAN (sudah
// diproses → tidak boleh diubah/dihapus oleh pemilik).
const assertKelola = async (
  id: string,
  sessionUser: { userId: string; role: string },
  opts: { harusDiajukan?: boolean } = {}
) => {
  const existing = await findPermohonanPindahByIdService(id);
  if (!existing) throw new ApiError(status.NOT_FOUND, MESSAGE.GLOBAL.NOT_FOUND);
  const isStaff = sessionUser.role === "ADMIN" || sessionUser.role === "PETUGAS";
  if (!isStaff && existing.userId !== sessionUser.userId) {
    throw new ApiError(status.FORBIDDEN, MESSAGE.GLOBAL.FORBIDDEN);
  }
  if (opts.harusDiajukan && existing.statusPermohonan !== "DIAJUKAN") {
    throw new ApiError(status.BAD_REQUEST, "Permohonan sudah diproses, tidak dapat diubah/dihapus.");
  }
  return existing;
};

export const createPermohonanPindahAction = async (payload: TCreatePermohonanPindahSchema) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);

    await createPermohonanPindahService(data.user.userId, payload);
    revalidatePath(PATHS.PINDAH_REQUEST);

    return { status: status.OK, message: message.PERMOHONAN_PINDAH.CREATE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updatePermohonanPindahAction = async (id: string, payload: TUpdatePermohonanPindahSchema) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);

    // (#4) IDOR fix: cek ownership + status masih DIAJUKAN.
    // Sebelumnya siapapun login bisa update permohonan siapapun via id.
    await assertKelola(id, data.user, { harusDiajukan: true });

    await updatePermohonanPindahService(id, payload);
    revalidatePath(PATHS.PINDAH_REQUEST);
    revalidatePath(`${PATHS.PINDAH_REQUEST}/${id}`);

    return { status: status.OK, message: message.PERMOHONAN_PINDAH.UPDATE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deletePermohonanPindahAction = async (id: string) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);

    // (#4) IDOR fix: cek ownership + status masih DIAJUKAN.
    // Sebelumnya siapapun login bisa hapus permohonan siapapun via id.
    await assertKelola(id, data.user, { harusDiajukan: true });

    await deletePermohonanPindahService(id);
    revalidatePath(PATHS.PINDAH_REQUEST);

    return { status: status.OK, message: message.PERMOHONAN_PINDAH.DELETE_OK };
  } catch (error) {
    return errorHandler(error);
  }
};

export const followUpPermohonanPindahAction = async (payload: TFollowUpPermohonanPindahSchema) => {
  try {
    const message = MESSAGE;
    const data = await findCurrentSessionService();
    if (!data) throw new ApiError(status.UNAUTHORIZED, message.GLOBAL.UNAUTHORIZED);

    // (#4) IDOR fix: followUp (approve/reject) khusus ADMIN/PETUGAS.
    // Sebelumnya user biasa bisa self-approve permohonan sendiri.
    const isStaff = data.user.role === "ADMIN" || data.user.role === "PETUGAS";
    if (!isStaff) throw new ApiError(status.FORBIDDEN, message.GLOBAL.FORBIDDEN);

    await followUpPermohonanPindahService(
      payload.permohonanPindahId,
      payload.statusPermohonan,
      payload.nomorPermohonan,
      payload.catatan
    );
    revalidatePath(PATHS.PINDAH_REQUEST);
    revalidatePath(`${PATHS.PINDAH_REQUEST}/${payload.permohonanPindahId}`);

    return { status: status.OK, message: message.PERMOHONAN_PINDAH.UPDATE_STATUS_OK };
  } catch (error) {
    return errorHandler(error);
  }
};
