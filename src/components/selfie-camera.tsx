"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFotoProfilAction } from "@/lib/server/actions/upload-foto-profil";
import { toast } from "sonner";

interface SelfieCameraProps {
  onCaptured: (url: string) => void;
  onCancel: () => void;
}

/**
 * Buka kamera depan (selfie) via getUserMedia, tangkap frame ke canvas,
 * unggah via uploadFotoProfilAction, lalu kembalikan URL foto.
 * Fallback: jika kamera tidak tersedia/ditolak, sediakan pemilih file (capture=input).
 */
export function SelfieCamera({ onCaptured, onCancel }: SelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"membuka" | "aktif" | "error" | "mengunggah">("membuka");
  const [pesanError, setPesanError] = useState("");

  useEffect(() => {
    let aktif = true;
    const mulai = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Browser tidak mendukung akses kamera.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (!aktif) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("aktif");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Tidak dapat membuka kamera.";
        setPesanError(msg);
        setStatus("error");
      }
    };
    mulai();
    return () => {
      aktif = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const ambilFoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    setStatus("mengunggah");
    try {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak didukung.");
      // Mirror agar sesuai preview selfie.
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar."))), "image/jpeg", 0.9)
      );
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadFotoProfilAction(formData);
      if (res.url) {
        // Hentikan kamera selesai.
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCaptured(res.url);
      } else {
        toast.error(res.error || "Gagal mengunggah foto.");
        setStatus("aktif");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengambil foto.");
      setStatus("aktif");
    }
  };

  const pilihDariGaleri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("mengunggah");
    (async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadFotoProfilAction(formData);
        if (res.url) {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          onCaptured(res.url);
        } else {
          toast.error(res.error || "Gagal mengunggah foto.");
          setStatus("error");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengunggah.");
        setStatus("error");
      } finally {
        e.target.value = "";
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Camera className="h-5 w-5" /> Ambil Foto Selfie
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={status === "mengunggah"}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-xl bg-black">
          {status !== "error" ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
              <Camera className="h-8 w-8" />
              <p>Kamera tidak tersedia.</p>
              <p className="text-xs">{pesanError}</p>
            </div>
          )}
          {status === "mengunggah" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Mengunggah foto…</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {status !== "error" ? (
            <>
              <Button onClick={ambilFoto} disabled={status !== "aktif"} className="w-full">
                {status === "mengunggah" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengunggah…</>
                ) : (
                  <><Camera className="mr-2 h-4 w-4" /> Ambil Foto</>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Posisikan wajah di lingkaran, lalu tekan &quot;Ambil Foto&quot;.
              </p>
            </>
          ) : (
            <>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <RefreshCw className="h-4 w-4" /> Pilih Foto dari Galeri
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pilihDariGaleri} className="hidden" />
              </label>
              <Button variant="outline" onClick={onCancel} className="w-full">Batal</Button>
            </>
          )}
          {status === "aktif" && (
            <Button variant="ghost" onClick={onCancel} className="w-full text-xs">Batal</Button>
          )}
        </div>
      </div>
    </div>
  );
}
