"use server";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { findCurrentSessionService } from "../services/session";

export const uploadGambarBeritaAction = async (formData: FormData) => {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return { error: "Anda harus login terlebih dahulu" };

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Gambar tidak ditemukan" };

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { error: "Format harus JPG, PNG, atau WebP" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Ukuran gambar maksimal 5 MB" };
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const pathname = `berita/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      token: process.env.NAMA_ENV_PERSIS_DISINI,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("ERROR ASLI (upload gambar berita):", error);
    return { error: "Gagal mengunggah gambar" };
  }
};
