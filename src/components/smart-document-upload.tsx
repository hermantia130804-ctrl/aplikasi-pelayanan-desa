"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, FileText, X, Loader2, RotateCw, Crop, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// === Kompresi gambar client-side ===
// Resize ke max 1200px, JPEG quality 0.65 — sekecil mungkin tapi masih terbaca
async function compressImage(file: File | Blob, maxDim = 1200, quality = 0.65): Promise<File> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal load gambar"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }

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
  } finally {
    URL.revokeObjectURL(url);
  }

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

interface SmartDocumentUploadProps {
  label: string;
  acceptedTypes?: "pdf" | "image" | "both";
  allowCamera?: boolean;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  required?: boolean;
}

export function SmartDocumentUpload({
  label,
  acceptedTypes = "both",
  allowCamera = true,
  currentUrl,
  onUploaded,
  onRemove,
  required = false,
}: SmartDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [editorRotation, setEditorRotation] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const acceptAttr = acceptedTypes === "pdf"
    ? "application/pdf"
    : acceptedTypes === "image"
    ? "image/jpeg,image/png,image/webp"
    : "application/pdf,image/jpeg,image/png,image/webp";

  const isPdf = currentUrl?.toLowerCase().endsWith(".pdf");

  // === Handle file dari galeri ===
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isPdfFile = file.type === "application/pdf";
    if (isPdfFile) {
      // PDF: upload langsung tanpa edit/kompres
      await uploadFile(file);
    } else {
      // Gambar: buka editor dulu (rotate + preview sebelum upload)
      setPendingFile(file);
      setEditorRotation(0);
      setShowEditor(true);
    }
  };

  // === Upload file ke server ===
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { uploadDocumentAction } = await import("@/lib/server/actions/upload-document");
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadDocumentAction(formData);
      if (res.url) {
        onUploaded(res.url);
        toast.success(`${label} berhasil diunggah`);
      } else {
        toast.error(res.error || "Gagal upload");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setUploading(false);
      setShowEditor(false);
      setShowCamera(false);
      setPendingFile(null);
    }
  };

  // === Editor: apply rotation + compress + upload ===
  const handleApplyEdit = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      let file = pendingFile;
      // Rotate jika perlu
      if (editorRotation > 0) {
        file = await rotateImage(file, editorRotation);
      }
      // Kompres
      const compressed = await compressImage(file, 1200, 0.65);
      await uploadFile(compressed);
    } catch {
      toast.error("Gagal memproses gambar");
      setUploading(false);
    }
  };

  // === Camera ===
  const startCamera = async () => {
    setShowCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung kamera");
      }
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
      // Kompres langsung tanpa editor (foto dari kamera biasanya sudah OK)
      const compressed = await compressImage(blob, 1200, 0.65);
      await uploadFile(compressed);
    } catch {
      toast.error("Gagal mengambil foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <label className="text-xs font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Preview current file */}
        {currentUrl ? (
          <div className="relative rounded-lg border p-2 bg-gray-50">
            {isPdf ? (
              <div className="flex items-center gap-2 py-2">
                <FileText className="h-8 w-8 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">File PDF terunggah</p>
                  <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                    Lihat PDF
                  </a>
                </div>
              </div>
            ) : (
              <img src={currentUrl} alt={label} className="w-full max-h-40 object-contain rounded" />
            )}
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3 w-3 mr-1" /> Ganti
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={onRemove}
                  disabled={uploading}
                >
                  <X className="h-3 w-3 mr-1" /> Hapus
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Upload buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Upload...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-1" /> Pilih File</>
                )}
              </Button>
              {allowCamera && acceptedTypes !== "pdf" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startCamera}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4 mr-1" /> Kamera
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {acceptedTypes === "pdf" ? "PDF" : acceptedTypes === "image" ? "JPG, PNG, WebP" : "PDF, JPG, PNG, WebP"}
              {" "}· maks 5 MB {acceptedTypes !== "pdf" && "· auto-kompres"}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* === Image Editor Modal === */}
      {showEditor && pendingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl p-4 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Crop className="h-4 w-4" /> Edit Gambar
              </h3>
              <button onClick={() => { setShowEditor(false); setPendingFile(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview dengan rotation */}
            <div className="relative rounded-lg overflow-hidden bg-gray-100 max-h-[300px] flex items-center justify-center">
              <img
                src={URL.createObjectURL(pendingFile)}
                alt="Preview"
                className="max-w-full max-h-[280px] object-contain"
                style={{ transform: `rotate(${editorRotation}deg)` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditorRotation(prev => (prev + 90) % 360)}
              >
                <RotateCw className="h-4 w-4 mr-1" /> Putar
              </Button>
              <span className="text-xs text-muted-foreground">{editorRotation}°</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleApplyEdit} disabled={uploading} className="flex-1">
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Upload...</>
                ) : (
                  <><Check className="h-4 w-4 mr-1" /> Upload</>
                )}
              </Button>
              <Button onClick={() => { setShowEditor(false); setPendingFile(null); }} variant="outline">
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === Camera Modal === */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" /> Ambil Foto
              </h3>
              <button onClick={stopCamera} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={capturePhoto} disabled={uploading} className="flex-1">
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Proses...</>
                ) : (
                  <><Camera className="h-4 w-4 mr-1" /> Ambil Foto</>
                )}
              </Button>
              <Button onClick={stopCamera} variant="outline">Batal</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
