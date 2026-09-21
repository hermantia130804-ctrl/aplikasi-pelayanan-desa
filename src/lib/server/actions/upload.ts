"use server";

import { uploadFile } from "../services/upload";

export const uploadDocumentAction = async (formData: FormData) => {
  try {
    const file = formData.get("file") as File | null;
    const bucketName = formData.get("bucketName") as string;

    if (!file) {
      return { success: false, error: "Tidak ada file yang diunggah" };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: "Ukuran file maksimal 5MB" };
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Format file tidak didukung. Gunakan PDF, JPG, atau PNG" };
    }

    const url = await uploadFile(file, bucketName);
    return { success: true, url };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengunggah dokumen"
    };
  }
} 