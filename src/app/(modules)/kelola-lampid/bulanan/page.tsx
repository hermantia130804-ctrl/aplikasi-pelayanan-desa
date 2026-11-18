import LampidBulananView from "@/components/lampid-bulanan-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Lampid Bulanan | Desa Sukamaju",
  description: "Laporan Penduduk Bulanan per RT/RW - Kelola Lampid",
};

export const dynamic = "force-dynamic";

export default function LampidBulananPage() {
  return <LampidBulananView />;
}
