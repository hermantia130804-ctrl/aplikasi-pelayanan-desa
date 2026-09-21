import { uploadDocumentAction } from "@/lib/server/actions/upload";
import { cn } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
  (
    {
      value,
      onChange,
      accept = ".pdf",
      placeholder = "Klik untuk memilih file (PDF)",
      disabled = false,
      className,
      bucketName,
      ...rest
    },
    ref
  ) => {
    const [uploading, setUploading] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [fileName, setFileName] = React.useState<string>("");

    const inputId = React.useId();

    const handleUpload = async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucketName", bucketName);
      const res = await uploadDocumentAction(formData);
      return res;
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (accept && !file.name.toLowerCase().endsWith(accept.replace(".", "").toLowerCase())) {
        setFileName("");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      setUploading(true);
      try {
        const res = await handleUpload(file);
        if (res.url) {
          onChange(res.url);
          toast.success("Dokumen berhasil diunggah");
        } else {
          onChange("");
          toast.error(res.error || "Gagal mengunggah dokumen");
        }
      } catch (err) {
        if (err instanceof Error) {
          onChange("");
          toast.error(err.message);
        }

      } finally {
        setUploading(false);
        setSelectedFile(null);
      }
    };

    return (
      <div className={cn("flex flex-col gap-2 relative", className)}>
        <div
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 relative",
            "hover:border-primary/50 transition-colors cursor-pointer",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {/* Input file absolute, full area, opacity 0, tetap accessible */}
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id={inputId}
            disabled={uploading || disabled}
            ref={ref}
            tabIndex={0}
            {...rest}
          />
          <div className="flex flex-col items-center justify-center gap-1 text-center pointer-events-none">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              {uploading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengunggah dokumen...
                </span>
              ) : fileName ? (
                fileName
              ) : value ? (
                <span className="text-green-600">Dokumen berhasil diunggah</span>
              ) : (
                placeholder
              )}
            </p>
            <p className="text-xs text-muted-foreground">Hanya menerima file PDF</p>
          </div>
        </div>
      </div>
    );
  }
);
FileUploadField.displayName = "FileUploadField"; 