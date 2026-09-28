"use server";

import status from "http-status";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { ApiError } from "next/dist/server/api-utils";
import { MESSAGE } from "@/constants/message";
import { errorHandler } from "../services/error";
import { requireFullAdmin } from "../guards";
import {
  findManyStrukturService,
  findStrukturByIdService,
  createStrukturService,
  updateStrukturService,
  deleteStrukturService,
} from "../services/struktur-organisasi";
import { z } from "zod";

const strukturSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  jabatan: z.string().min(3, "Jabatan minimal 3 karakter"),
  fotoUrl: z.string().optional(),
  urutan: z.coerce.number().int().min(1).default(1),
});

export const findManyStrukturAction = async () => {
  try {
    await requireFullAdmin();
    const data = await findManyStrukturService();
    return { status: status.OK, data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const createStrukturAction = async (payload: unknown) => {
  try {
    await requireFullAdmin();
    const parsed = strukturSchema.parse(payload);
    const data = await createStrukturService(parsed);
    revalidatePath("/struktur-organisasi");
    revalidatePath("/");
    return { status: status.OK, message: "Struktur organisasi berhasil ditambahkan", data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const updateStrukturAction = async (id: string, payload: unknown) => {
  try {
    await requireFullAdmin();
    const parsed = strukturSchema.parse(payload);
    const data = await updateStrukturService(id, parsed);
    revalidatePath("/struktur-organisasi");
    revalidatePath("/");
    return { status: status.OK, message: "Struktur organisasi berhasil diperbarui", data };
  } catch (error) {
    return errorHandler(error);
  }
};

export const deleteStrukturAction = async (id: string) => {
  try {
    await requireFullAdmin();

    const existing = await findStrukturByIdService(id);
    if (existing?.fotoUrl) {
      try { await del(existing.fotoUrl); } catch (e) { console.error(e); }
    }

    await deleteStrukturService(id);
    revalidatePath("/struktur-organisasi");
    revalidatePath("/");
    return { status: status.OK, message: "Struktur organisasi berhasil dihapus" };
  } catch (error) {
    return errorHandler(error);
  }
};
