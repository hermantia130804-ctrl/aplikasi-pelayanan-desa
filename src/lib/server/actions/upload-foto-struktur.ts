"use server";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { findCurrentSessionService } from "../services/session";

export const uploadFotoStrukturAction = async (formData: FormData) => {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return { error: "Anda harus login terlebih dahulu" };

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Foto tidak ditemukan" };

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { error: "Format harus JPG, PNG, atau WebP" };
    }
    if (file.size > 3 * 1024 * 1024) {
      return { error: "Ukuran foto maksimal 3 MB" };
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const pathname = `struktur/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("ERROR ASLI (upload foto struktur):", error);
    return { error: "Gagal mengunggah foto" };
  }
};
