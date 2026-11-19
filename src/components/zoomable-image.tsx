'use client';

import { useState, useCallback } from "react";
import { X, Download, ZoomIn } from "lucide-react";
import { toast } from "sonner";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  downloadable?: boolean;
  downloadName?: string;
}

export function ZoomableImage({ src, alt, className = "", downloadable = false, downloadName }: ZoomableImageProps) {
  const [zoomed, setZoomed] = useState(false);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName || alt || "foto";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Foto berhasil diunduh");
    } catch {
      // Fallback: buka di tab baru
      window.open(src, "_blank");
      toast.info("Foto dibuka di tab baru. Klik kanan → Save As untuk mengunduh.");
    }
  }, [src, downloadName, alt]);

  return (
    <>
      <div className="group relative cursor-pointer" onClick={() => setZoomed(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100 rounded-lg">
          <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Tombol close */}
            <button
              className="absolute -top-3 -right-3 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
              onClick={() => setZoomed(false)}
            >
              <X className="h-5 w-5 text-gray-800" />
            </button>
            {/* Tombol download */}
            {downloadable && (
              <button
                className="absolute -bottom-3 right-0 rounded-full bg-emerald-600 p-2 shadow-lg hover:bg-emerald-700"
                onClick={handleDownload}
              >
                <Download className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
