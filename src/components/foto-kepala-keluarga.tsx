"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Image as ImageIcon, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFotoKkAction } from "@/lib/server/actions/upload-foto-kk";
import { pendudukRTAction } from "@/lib/server/actions/penduduk-rt";
import { pendudukSementaraRTAction } from "@/lib/server/actions/penduduk-sementara-rt";
import { toast } from "sonner";

/**
 * Kompres gambar sebelum upload:
 * - Resize ke max 800×800px (maintain aspect ratio)
 * - Convert ke JPEG quality 0.8
 * - Hasil: ~50-100KB per foto (cukup kecil untuk Vercel Blob Hobby 1GB)
 */
async function compressImage(file: File | Blob, maxDim = 800, quality = 0.8): Promise<File> {
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
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error("Gagal kompres gambar")),
      "image/jpeg",
      quality
    )
  );
  return new File([blob], "foto-kk.jpg", { type: "image/jpeg" });
}

interface FotoKepalaKeluargaProps {
  recordId: string;
  fotoUrl?: string | null;
  namaKepala: string;
  canEdit?: boolean;
  onUpdated?: () => void;
  size?: number;
  source?: "penduduk" | "sementara";
}

/**
 * Component foto kepala keluarga:
 * - Bingkai bulat, tampil di dalam grup KK
 * - Klik foto untuk perbesar (modal full-size)
 * - Upload via kamera atau galeri (hanya jika canEdit)
 * - Hanya untuk KEPALA KELUARGA
 */
export function FotoKepalaKeluarga({
  recordId,
  fotoUrl,
  namaKepala,
  canEdit = false,
  onUpdated,
  size = 48,
  source = "penduduk",
}: FotoKepalaKeluargaProps) {
  const [showEnlarged, setShowEnlarged] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFoto, setCurrentFoto] = useState(fotoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update currentFoto jika prop berubah
  useEffect(() => { setCurrentFoto(fotoUrl); }, [fotoUrl]);

  // Cleanup kamera saat unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  const inisial = namaKepala.trim().charAt(0).toUpperCase() || "?";

  const handleSaveFoto = useCallback(async (url: string) => {
    setUploading(true);
    try {
      const action = source === "sementara" ? pendudukSementaraRTAction : pendudukRTAction;
      const r = await action("updateFotoKk", { id: recordId, fotoKk: url });
      if (r.status === 200) {
        setCurrentFoto(url);
        toast.success("Foto kepala keluarga berhasil disimpan");
        onUpdated?.();
      } else {
        toast.error(r.error || "Gagal menyimpan foto");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setUploading(false);
      setShowUploadMenu(false);
      setShowCamera(false);
    }
  }, [recordId, onUpdated, source]);

  // === Kamera ===
  const startCamera = async () => {
    setShowUploadMenu(false);
    setShowCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung kamera");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
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
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak didukung");
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("Gagal membuat gambar")), "image/jpeg", 0.9)
      );
      // Kompres: resize max 800x800 + JPEG quality 0.8
      const compressedFile = await compressImage(blob, 800, 0.8);
      const formData = new FormData();
      formData.append("file", compressedFile);
      const res = await uploadFotoKkAction(formData);
      if (res.url) {
        stopCamera();
        await handleSaveFoto(res.url);
      } else {
        toast.error(res.error || "Gagal upload");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengambil foto");
    } finally {
      setUploading(false);
    }
  };

  // === Galeri ===
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setShowUploadMenu(false);
    try {
      // Kompres: resize max 800x800 + JPEG quality 0.8
      const compressedFile = await compressImage(file, 800, 0.8);
      const formData = new FormData();
      formData.append("file", compressedFile);
      const res = await uploadFotoKkAction(formData);
      if (res.url) {
        await handleSaveFoto(res.url);
      } else {
        toast.error(res.error || "Gagal upload");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      {/* Circular avatar */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (currentFoto) {
              setShowEnlarged(true);
            } else if (canEdit) {
              setShowUploadMenu(true);
            }
          }}
          className="rounded-full overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
          style={{ width: size, height: size }}
        >
          {currentFoto ? (
            <img src={currentFoto} alt={namaKepala} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
              <User className="h-5 w-5" />
            </div>
          )}
        </button>

        {/* Badge edit indicator */}
        {canEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowUploadMenu(true);
            }}
            className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 text-white p-1 shadow-md hover:bg-emerald-600 transition-colors"
            style={{ width: size * 0.35, height: size * 0.35, minWidth: 18 }}
            title="Ubah foto"
          >
            <Camera className="h-3 w-3" />
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Upload menu popup */}
      {showUploadMenu && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUploadMenu(false)}>
          <div className="bg-white rounded-xl p-4 shadow-xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Foto Kepala Keluarga</h3>
              <button onClick={() => setShowUploadMenu(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2">
              <Button onClick={startCamera} className="w-full" variant="default">
                <Camera className="h-4 w-4 mr-2" /> Ambil dari Kamera
              </Button>
              <Button onClick={() => { setShowUploadMenu(false); fileInputRef.current?.click(); }} className="w-full" variant="outline">
                <ImageIcon className="h-4 w-4 mr-2" /> Pilih dari Galeri
              </Button>
              {currentFoto && (
                <Button
                  onClick={async () => {
                    setUploading(true);
                    setShowUploadMenu(false);
                    try {
                      const action = source === "sementara" ? pendudukSementaraRTAction : pendudukRTAction;
                      const r = await action("updateFotoKk", { id: recordId, fotoKk: "" });
                      if (r.status === 200) {
                        setCurrentFoto(null);
                        toast.success("Foto dihapus");
                        onUpdated?.();
                      }
                    } catch { toast.error("Gagal menghapus"); }
                    finally { setUploading(false); }
                  }}
                  className="w-full text-red-600"
                  variant="ghost"
                >
                  Hapus Foto
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm bg-white rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Camera className="h-4 w-4" /> Ambil Foto</h3>
              <button onClick={stopCamera} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-full bg-black">
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={capturePhoto} disabled={uploading} className="flex-1">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Upload...</> : <><Camera className="h-4 w-4 mr-2" /> Ambil</>}
              </Button>
              <Button onClick={stopCamera} variant="outline">Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarge modal */}
      {showEnlarged && currentFoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setShowEnlarged(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setShowEnlarged(false)}>
            <X className="h-8 w-8" />
          </button>
          <img src={currentFoto} alt={namaKepala} className="max-w-full max-h-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">{namaKepala}</p>
        </div>
      )}

      {/* Hidden file input for gallery */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
    </>
  );
}
