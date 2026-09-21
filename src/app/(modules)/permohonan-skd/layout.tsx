import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Permohonan SKD",
  description: "Kelola permohonan Surat Keterangan Domisili",
};

export default function PermohonanSKDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
