import LampidUsiaView from "@/components/lampid-usia-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Berdasarkan Usia | Desa Sukamaju",
  description: "Laporan Penduduk Berdasarkan Kelompok Umur - Kelola Lampid",
};

export const dynamic = "force-dynamic";

export default function LampidUsiaPage() {
  return <LampidUsiaView />;
}
