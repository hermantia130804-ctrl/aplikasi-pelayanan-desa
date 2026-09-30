"use server";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { findCurrentSessionService } from "../services/session";

export const uploadFotoDesilAction = async (formData: FormData) => {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return { error: "Anda harus login terlebih dahulu" };

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Foto tidak ditemukan" };

    // Wajib JPG (data warga bersifat privat; format dihomogenkan)
    if (file.type !== "image/jpeg") {
      return { error: "Format wajib JPG (image/jpeg)" };
    }
    if (file.size > 1 * 1024 * 1024) {
      return { error: "Ukuran foto maksimal 1 MB per file" };
    }

    const pathname = `perbaikan-desil/${randomUUID()}.jpg`;
    const blob = await put(pathname, file, {
      access: "private",
      contentType: "image/jpeg",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("ERROR ASLI (upload foto desil):", error);
    return { error: "Gagal mengunggah foto" };
  }
};
