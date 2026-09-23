"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { PermohonanKKPdfTemplate } from "./permohonan-kk-pdf-template";
import { PermohonanKK } from "@/generated/prisma";
import { Button } from "@/components/ui/button";

interface PermohonanKKPDFDownloadButtonProps {
  data: PermohonanKK;
  fileName: string;
  namaKepalaDesa?: string;
  className?: string;
}

export function PermohonanKKPDFDownloadButton({ data, fileName, namaKepalaDesa, className }: PermohonanKKPDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<PermohonanKKPdfTemplate data={data} namaKepalaDesa={namaKepalaDesa} />}
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
