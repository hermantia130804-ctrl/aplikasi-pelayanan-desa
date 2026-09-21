"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { PermohonanKtpPdfTemplate } from "./permohonan-ktp-pdf-template";
import { PermohonanKTP } from "@/generated/prisma";
import { Button } from "@/components/ui/button";

interface PermohonanKTPPDFDownloadButtonProps {
  data: PermohonanKTP;
  fileName: string;
  className?: string;
}

export function PermohonanKTPPDFDownloadButton({ data, fileName, className }: PermohonanKTPPDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<PermohonanKtpPdfTemplate data={data} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button asChild variant="secondary" className={className} disabled={loading}>
          <span>{loading ? "Menyiapkan PDF..." : "Download PDF"}</span>
        </Button>
      )}
    </PDFDownloadLink>
  );
} 