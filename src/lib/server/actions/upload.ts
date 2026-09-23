"use server"

import { uploadFile } from "../services/upload";
import { findCurrentSessionService } from "../services/session";

export const uploadDocumentAction = async (formData: FormData) => {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user) return { error: "Anda harus login terlebih dahulu" };

    const file = formData.get("file") as File | null;
    const bucketName = (formData.get("bucketName") as string) || "dokumen";

    if (!file) return { error: "File tidak ditemukan" };
    if (file.size > 9 * 1024 * 1024) return { error: "Ukuran file maksimal 9 MB" };

    const url = await uploadFile(file, bucketName);
    return { url };
  } catch (error) {
    console.error("ERROR ASLI (upload):", error);
    return { error: "Gagal mengunggah dokumen" };
  }
}
