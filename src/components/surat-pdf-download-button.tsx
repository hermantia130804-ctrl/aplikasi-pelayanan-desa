"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import {
  SuratSKLDocument,
  SuratSKTMDocument,
  SuratSKKDocument,
  SuratSKUDocument,
  SuratSKDDocument,
} from "./surat-resmi-templates";

type JenisSurat = "SKL" | "SKTM" | "SKK" | "SKU" | "SKD";

interface SuratPDFDownloadButtonProps {
  jenis: JenisSurat;
  data: any;
  className?: string;
  label?: string;
}

export function SuratPDFDownloadButton({ jenis, data, className, label }: SuratPDFDownloadButtonProps) {
  const fileName = `Surat-${jenis}-${data.nomorPermohonan ?? "draft"}.pdf`;

  const documentElement = (() => {
    switch (jenis) {
      case "SKL": return <SuratSKLDocument data={data} />;
      case "SKTM": return <SuratSKTMDocument data={data} />;
      case "SKK": return <SuratSKKDocument data={data} />;
      case "SKU": return <SuratSKUDocument data={data} />;
      case "SKD": return <SuratSKDDocument data={data} />;
      default: return null;
    }
  })();

  if (!documentElement) return null;

  return (
    <PDFDownloadLink document={documentElement} fileName={fileName}>
      {({ loading }) => (
        <Button asChild variant="secondary" className={className} disabled={loading}>
          <span>{loading ? "Menyiapkan PDF..." : (label ?? "Download PDF")}</span>
        </Button>
      )}
    </PDFDownloadLink>
  );
}
