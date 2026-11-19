"use client";

import { Image as ImageIcon, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CekBansosUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

export const CekBansosUploadField = React.forwardRef<HTMLInputElement, CekBansosUploadFieldProps>(
  ({ value, onChange, disabled = false, className }, ref) => {
    const [uploading, setUploading] = React.useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { uploadFotoCekBansosAction } = await import("@/lib/server/actions/upload-foto-cek-bansos");
        const res = await uploadFotoCekBansosAction(formData);
        if (res.url) {
          onChange(res.url);
          toast.success("Foto berhasil diunggah");
        } else {
          onChange("");
          toast.error(res.error || "Gagal mengunggah foto");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto");
        onChange("");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    };

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {value && (
          <div className="h-40 w-full rounded-lg border overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Pratinjau" className="h-40 w-full object-contain" />
          </div>
        )}
        <div className="relative border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading || disabled}
            ref={ref}
          />
          <div className="flex flex-col items-center justify-center gap-1 text-center pointer-events-none">
            {uploading ? (
              <span className="flex items-center gap-1 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...
              </span>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">{value ? "Ganti foto" : "Klik untuk pilih foto"}</p>
                <p className="text-xs text-muted-foreground">JPG/PNG/WebP · maksimal 2 MB</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);
CekBansosUploadField.displayName = "CekBansosUploadField";
