"use server";

import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { findCurrentSessionService } from "../services/session";

/**
 * Upload dokumen pengajuan (PDF atau gambar).
 * - PDF: upload langsung (max 5MB)
 * - Gambar: upload langsung (kompresi dilakukan client-side sebelum upload)
 */
export const uploadDocumentAction = async (formData: FormData) => {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return { error: "Anda harus login terlebih dahulu" };

    const file = formData.get("file") as File | null;
    if (!file) return { error: "File tidak ditemukan" };

    const isPdf = file.type === "application/pdf";
    const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const isValidType = isPdf || validImageTypes.includes(file.type);

    if (!isValidType) {
      return { error: "Format harus PDF, JPG, PNG, atau WebP" };
    }

    // PDF: max 5MB. Gambar: max 5MB (sudah dikompres client-side)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Ukuran file maksimal 5 MB" };
    }

    const ext = isPdf ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const pathname = `dokumen-pengajuan/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN,
    });

    return { url: blob.url };
  } catch (error) {
    console.error("ERROR upload document:", error);
    return { error: "Gagal mengunggah file" };
  }
};

/**
 * Hapus blob dari Vercel Blob berdasarkan URL.
 * Dipanggil saat admin/petugas menghapus pengajuan → dokumen juga terhapus.
 */
export const deleteBlobsAction = async (urls: string[]) => {
  try {
    if (!urls || urls.length === 0) return { deleted: 0 };

    // Filter hanya URL dari Vercel Blob (mulai dengan https://...public.blob.vercel-storage.com atau类似)
    const blobUrls = urls.filter(u => u && u.startsWith("http"));

    if (blobUrls.length === 0) return { deleted: 0 };

    await del(blobUrls, {
      token: process.env.BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN,
    });

    return { deleted: blobUrls.length };
  } catch (error) {
    console.error("ERROR delete blobs:", error);
    return { deleted: 0, error: "Gagal menghapus beberapa file" };
  }
};
