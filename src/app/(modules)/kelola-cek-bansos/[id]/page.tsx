import { CekBansosTindakLanjut } from "@/components/cek-bansos-tindak-lanjut";
import { findCekBansosByIdAction } from "@/lib/server/actions/cek-bansos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import moment from "moment";
import { ZoomableImage } from "@/components/zoomable-image";

export const dynamic = "force-dynamic";

function Baris({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

const badgeVarian: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DIAJUKAN: "secondary",
  SELESAI: "default",
  DITOLAK: "destructive",
};

export default async function KelolaCekBansosDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await findCekBansosByIdAction(id);
  if (!("data" in res)) notFound();
  const d = res.data;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 max-w-2xl">
          <Button asChild variant="outline" className="w-fit">
            <Link href="/kelola-cek-bansos"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{d.nomorPermohonan}</h1>
            <Badge variant={badgeVarian[d.statusPermohonan] ?? "outline"}>{d.statusPermohonan}</Badge>
          </div>
          <p className="text-muted-foreground -mt-2 text-sm">
            Pemohon: {d.user?.name ?? "-"} ({d.user?.email ?? "-"}) · Diajukan {moment(d.createdAt).format("DD MMMM YYYY HH:mm")}
          </p>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-2 font-bold">Identitas Keluarga</h2>
            <Baris label="Nama Kepala Keluarga" value={d.namaKepalaKeluarga} />
            <Baris label="NIK" value={d.nik} />
            <Baris label="No. Kartu Keluarga" value={d.noKk} />
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-2 font-bold">Foto KK</h2>
            <ZoomableImage src={d.fotoKkUrl} alt="Foto KK" className="h-48 w-full rounded-lg border object-contain bg-muted" downloadable downloadName={`Foto_KK_${d.noKk}.jpg`} />
          </div>

          <CekBansosTindakLanjut
            cekBansosId={d.cekBansosId}
            statusPermohonan={d.statusPermohonan}
            alasanDitolak={d.alasanDitolak ?? ""}
            keteranganSelesai={d.keteranganSelesai ?? ""}
            fotoHasilUrl={d.fotoHasilUrl ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
