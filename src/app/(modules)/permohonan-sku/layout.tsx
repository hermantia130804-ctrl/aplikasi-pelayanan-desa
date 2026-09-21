import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Permohonan SKU",
  description: "Manajemen permohonan Surat Keterangan Usaha",
};

interface PermohonanSKULayoutProps {
  children: React.ReactNode;
}

export default function PermohonanSKULayout({
  children,
}: PermohonanSKULayoutProps) {
  return <>{children}</>;
}
