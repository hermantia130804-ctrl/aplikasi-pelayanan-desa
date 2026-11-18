"use server";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

/**
 * Upload foto profil (selfie) untuk pendaftaran akun.
 *
 * Konteks: dipanggil dari form pendaftaran publik SEBELUM user login
 * (masyarakat tidak butuh kamera; petugas/RT ambil selfie lalu upload di sini).
 * Karena belum ada session, tidak ada requireSession — keamanan diandalkan pada:
 *   - validasi tipe (JPG/PNG/WebP),
 *   - batas ukuran (3 MB),
 *   - pathname acak (randomUUID) supaya tidak bisa ditebak/dikolisi.
 *
 * Token: BLOB_READ_WRITE_TOKEN (sama seperti upload foto struktur).
 */
export const uploadFotoProfilAction = async (formData: FormData) => {
  try {
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
    const pathname = `profil/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("ERROR upload foto profil:", error);
    return { error: "Gagal mengunggah foto" };
  }
};
