"use server";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { findCurrentSessionService } from "../services/session";

const MAX = 2 * 1024 * 1024; // 2 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const uploadFotoCekBansosAction = async (formData: FormData) => {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return { error: "Anda harus login terlebih dahulu" };

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Foto tidak ditemukan" };
    if (!EXT[file.type]) return { error: "Format wajib JPG, PNG, atau WebP" };
    if (file.size > MAX) return { error: "Ukuran foto maksimal 2 MB" };

    const ext = EXT[file.type];
    const pathname = "cek-bansos/" + randomUUID() + "." + ext;
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("ERROR (upload foto cek bansos):", error);
    return { error: "Gagal mengunggah foto" };
  }
};
