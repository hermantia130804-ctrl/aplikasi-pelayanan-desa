"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Camera, RotateCw, Check, X, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// === Kompresi gambar client-side ===
async function compressImage(file: File | Blob, maxDim = 1200, quality = 0.65): Promise<File> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal load gambar"));
      img.src = url;
    });
  } finally { URL.revokeObjectURL(url); }

  let { naturalWidth: width, naturalHeight: height } = img;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("Gagal kompres")), "image/jpeg", quality)
  );
  return new File([blob], "document.jpg", { type: "image/jpeg" });
}

// === Rotate image ===
async function rotateImage(file: File | Blob, degrees: number): Promise<File> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal load"));
      img.src = url;
    });
  } finally { URL.revokeObjectURL(url); }

  const canvas = document.createElement("canvas");
  if (degrees === 90 || degrees === 270) {
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
  } else {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("Gagal rotate")), "image/jpeg", 0.9)
  );
  return new File([blob], "document.jpg", { type: "image/jpeg" });
}

interface FileUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  bucketName: string;
}

export const FileUploadField = React.forwardRef<HTMLInputElement, FileUploadFieldProps>(
  ({ value, onChange, accept, placeholder, disabled = false, className, bucketName, ...rest }, ref) => {
    // Default accept: PDF + gambar
    const effectiveAccept = accept || ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
    const allowsImage = effectiveAccept.includes("image") || effectiveAccept.includes("jpg") || effectiveAccept.includes("png") || effectiveAccept.includes("webp");
    const allowsPdf = effectiveAccept.includes("pdf");

    const [uploading, setUploading] = React.useState(false);
    const [showEditor, setShowEditor] = React.useState(false);
    const [pendingFile, setPendingFile] = React.useState<File | null>(null);
    const [rotation, setRotation] = React.useState(0);
    const [showCamera, setShowCamera] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    const isPdf = value?.toLowerCase().endsWith(".pdf") || value?.includes("application/pdf");

    // === Upload file ke server (pakai action existing) ===
    const doUpload = async (file: File) => {
      setUploading(true);
      try {
        const { uploadDocumentAction } = await import("@/lib/server/actions/upload");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucketName", bucketName);
        const res = await uploadDocumentAction(formData);
        if (res.url) {
          onChange(res.url);
          toast.success("Dokumen berhasil diunggah");
        } else {
          onChange("");
          toast.error(res.error || "Gagal mengunggah dokumen");
        }
      } catch (err) {
        onChange("");
        toast.error(err instanceof Error ? err.message : "Gagal upload");
      } finally {
        setUploading(false);
        setShowEditor(false);
        setShowCamera(false);
        setPendingFile(null);
      }
    };

    // === Handle file dari galeri ===
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      const isPdfFile = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdfFile) {
        // PDF: upload langsung
        await doUpload(file);
      } else {
        // Gambar: buka editor dulu
        setPendingFile(file);
        setRotation(0);
        setShowEditor(true);
      }
    };

    // === Editor: apply rotation + compress + upload ===
    const handleApplyEdit = async () => {
      if (!pendingFile) return;
      setUploading(true);
      try {
        let file = pendingFile;
        if (rotation > 0) file = await rotateImage(file, rotation);
        const compressed = await compressImage(file, 1200, 0.65);
        await doUpload(compressed);
      } catch {
        toast.error("Gagal memproses gambar");
        setUploading(false);
      }
    };

    // === Camera ===
    const startCamera = async () => {
      setShowCamera(true);
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Browser tidak mendukung kamera");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Tidak dapat membuka kamera");
        setShowCamera(false);
      }
    };

    const stopCamera = () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setShowCamera(false);
    };

    const capturePhoto = async () => {
      const video = videoRef.current;
      if (!video) return;
      setUploading(true);
      try {
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas tidak didukung");
        ctx.drawImage(video, 0, 0, w, h);
        const blob: Blob = await new Promise((resolve, reject) =>
          canvas.toBlob(b => b ? resolve(b) : reject(new Error("Gagal capture")), "image/jpeg", 0.9)
        );
        stopCamera();
        const compressed = await compressImage(blob, 1200, 0.65);
        await doUpload(compressed);
      } catch { toast.error("Gagal mengambil foto"); }
      finally { setUploading(false); }
    };

    const inputId = React.useId();
    const acceptLabel = allowsPdf && allowsImage ? "PDF, JPG, PNG, WebP" : allowsPdf ? "PDF" : "JPG, PNG, WebP";

    return (
      <div className={cn("flex flex-col gap-2 relative", className)}>
        {/* Preview jika sudah ada file */}
        {value ? (
          <div className="rounded-lg border p-2 bg-gray-50">
            {isPdf ? (
              <div className="flex items-center gap-2 py-1">
                <FileText className="h-6 w-6 text-red-500 shrink-0" />
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate">
                  Lihat dokumen PDF
                </a>
              </div>
            ) : (
              <img src={value} alt="Dokumen" className="w-full max-h-32 object-contain rounded" />
            )}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || disabled}
                className="text-xs text-blue-500 hover:underline">Ganti</button>
              <button type="button" onClick={() => onChange("")} disabled={uploading || disabled}
                className="text-xs text-red-500 hover:underline">Hapus</button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center gap-1 relative",
            "hover:border-primary/50 transition-colors cursor-pointer",
            uploading && "opacity-50 cursor-not-allowed"
          )}>
            <input
              ref={React.useCallback((node: HTMLInputElement | null) => {
                inputRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }, [ref])}
              type="file"
              accept={effectiveAccept}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id={inputId}
              disabled={uploading || disabled}
              {...rest}
            />
            <div className="flex flex-col items-center justify-center gap-1 text-center pointer-events-none">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {uploading ? "Mengunggah..." : placeholder || `Klik untuk pilih file (${acceptLabel})`}
              </p>
              <p className="text-[10px] text-muted-foreground">{acceptLabel} · maks 9 MB{allowsImage && " · auto-kompres"}</p>
            </div>
          </div>
        )}

        {/* Camera button */}
        {allowsImage && !value && !uploading && (
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
          >
            <Camera className="h-3 w-3" /> atau ambil foto dari kamera
          </button>
        )}

        {/* === Image Editor Modal === */}
        {showEditor && pendingFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-xl p-4 shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Edit Gambar</h3>
                <button onClick={() => { setShowEditor(false); setPendingFile(null); }}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-100 max-h-[280px] flex items-center justify-center">
                <img src={URL.createObjectURL(pendingFile)} alt="Preview" className="max-w-full max-h-[260px] object-contain" style={{ transform: `rotate(${rotation}deg)` }} />
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button type="button" onClick={() => setRotation(p => (p + 90) % 360)} className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded border">
                  <RotateCw className="h-4 w-4" /> Putar ({rotation}°)
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleApplyEdit} disabled={uploading} className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-500 text-white text-sm px-4 py-2 rounded hover:bg-emerald-600">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Upload...</> : <><Check className="h-4 w-4" /> Upload</>}
                </button>
                <button onClick={() => { setShowEditor(false); setPendingFile(null); }} className="px-4 py-2 text-sm border rounded">Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* === Camera Modal === */}
        {showCamera && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="w-full max-w-md bg-white rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Camera className="h-4 w-4" /> Ambil Foto</h3>
                <button onClick={stopCamera}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={capturePhoto} disabled={uploading} className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-500 text-white text-sm px-4 py-2 rounded hover:bg-emerald-600">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Proses...</> : <><Camera className="h-4 w-4" /> Ambil Foto</>}
                </button>
                <button onClick={stopCamera} className="px-4 py-2 text-sm border rounded">Batal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
FileUploadField.displayName = "FileUploadField";
