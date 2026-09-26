"use server";

import status from "http-status";
import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import { del } from "@vercel/blob";
import { errorHandler } from "../services/error";
import {
  createBeritaService,
  deleteBeritaService,
  findBeritaByIdService,
  findManyBeritaService,
  updateBeritaService,
  buatSlug,
} from "../services/berita-kegiatan";
import { findCurrentSessionService } from "../services/session";
import { createBeritaSchema, updateBeritaSchema } from "@/lib/validators/berita";

const requireStaff = async () => {
  const session = await findCurrentSessionService();
  if (!session?.user) throw new ApiError(status.UNAUTHORIZED, "Anda belum masuk.");
  if (session.user.role !== "ADMIN" && session.user.role !== "PETUGAS") {
    throw new ApiError(status.FORBIDDEN, "Hanya admin dan petugas yang dapat mengelola berita");
  }
  return session;
};

export const createBeritaAction = async (payload: unknown) => {
  try {
    const session = await requireStaff();
    const parsed = createBeritaSchema.parse(payload);
    const slug = buatSlug(parsed.judul, parsed.tanggalKegiatan);

    const data = await createBeritaService(session.user.userId, {
      judul: parsed.judul,
      slug,
      isi: parsed.isi,
      kategoriMedia: parsed.kategoriMedia,
      gambarUrl: parsed.gambarUrl ?? null,
      youtubeId: parsed.youtubeId ?? null,
      tanggalKegiatan: parsed.tanggalKegiatan,
    });

    revalidatePath("/beranda-masyarakat");
    revalidatePath("/berita-kegiatan");
    return { status: status.OK, message: "Berita kegiatan berhasil dipublikasikan", data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updateBeritaAction = async (id: string, payload: unknown) => {
  try {
    await requireStaff();
    const parsed = updateBeritaSchema.parse(payload);
    const data = await updateBeritaService(id, {
      ...parsed,
      gambarUrl: parsed.gambarUrl ?? null,
      youtubeId: parsed.youtubeId ?? null,
    });
    revalidatePath("/berita-kegiatan");
    revalidatePath("/beranda-masyarakat");
    return { status: status.OK, message: "Berita kegiatan berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deleteBeritaAction = async (id: string) => {
  try {
    await requireStaff();

    // Hapus gambar dari Blob juga
    const berita = await findBeritaByIdService(id);
    if (berita?.gambarUrl) {
      try { await del(berita.gambarUrl); } catch (e) { console.error(e); }
    }

    await deleteBeritaService(id);
    revalidatePath("/berita-kegiatan");
    revalidatePath("/beranda-masyarakat");
    return { status: status.OK, message: "Berita kegiatan berhasil dihapus" };
  } catch (error) {
    return errorHandler(error);
  }
};

export const findBeritaByIdAction = async (id: string) => {
  try {
    await requireStaff();
    const data = await findBeritaByIdService(id);
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const findManyBeritaAction = async () => {
  try {
    await requireStaff();
    const data = await findManyBeritaService();
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};
