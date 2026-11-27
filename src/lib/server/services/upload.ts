import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";

export async function uploadFile(file: File, bucketName: string): Promise<string> {
  try {
    const ext = file.name.split(".").pop() || "pdf";
    const pathname = `${bucketName}/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      // "public" wajib agar URL bisa di-load di <img> preview + tampil di detail.
      // "private" -> URL 401/403 saat browser fetch -> gambar tidak tampil meski upload sukses.
      // Konsisten dgn uploadFotoCekBansosAction/uploadGambarBeritaAction.
      access: "public",
      contentType: file.type || "application/pdf",
      // Token WAJIB eksplisit — jangan andalkan env standar BLOB_READ_WRITE_TOKEN.
      // 7 action lain pakai BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN; tanpa token -> put() throw
      // "No token found" -> toast "Gagal mengunggah dokumen".
      token: process.env.BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN,
    });
    console.log(`File uploaded to Vercel Blob: ${blob.pathname}`);
    return blob.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    // Pertahankan pesan error asli (mis. "No token found") supaya tampak di toast diagnosa.
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error("Gagal mengunggah dokumen: " + detail);
  }
}

export async function deleteFile(url: string, _bucketName?: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
