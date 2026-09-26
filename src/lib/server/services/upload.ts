import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";

export async function uploadFile(file: File, bucketName: string): Promise<string> {
  try {
    const ext = file.name.split(".").pop() || "pdf";
    const pathname = `${bucketName}/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      access: "private",
      contentType: file.type || "application/pdf",
    } as never);
    console.log(`File uploaded to Vercel Blob: ${blob.pathname}`);
    return blob.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Gagal mengunggah dokumen");
  }
}

export async function deleteFile(url: string, _bucketName?: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
