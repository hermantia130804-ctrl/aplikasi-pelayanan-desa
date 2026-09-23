import { put, del, head } from "@vercel/blob";
import { randomUUID } from "crypto";

export async function uploadFile(file: File, bucketName: string): Promise<string> {
  try {
    const ext = file.name.split(".").pop() || "pdf";
    const pathname = `${bucketName}/${randomUUID()}.${ext}`;
    const blob = await put(pathname, file, {
      access: "private",
      contentType: file.type || "application/pdf",
      allowPublicAccess: false,
    } as never);
    console.log(`File uploaded to Vercel Blob (private): ${blob.pathname}`);
    // URL disimpan, tapi nanti diakses via temporary URL
    return blob.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Gagal mengunggah dokumen");
  }
}

// Buat URL sementara (berlaku 1 jam) untuk melihat dokumen
export async function getTemporaryUrl(url: string): Promise<string | null> {
  try {
    const metadata = await head(url);
    if (!metadata) return null;
    const { downloadUrl } = await import("@vercel/blob").then((m) =>
      m.getDownloadUrl ? m.getDownloadUrl(url) : { downloadUrl: url }
    );
    return downloadUrl ?? url;
  } catch {
    return null;
  }
}

export async function deleteFile(url: string, _bucketName?: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
