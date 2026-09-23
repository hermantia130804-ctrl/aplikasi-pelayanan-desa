import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KKUpdateStatus } from "@/components/permohonan-kk-update-status";
import { findPermohonanKKData } from "@/lib/server/data/permohonan-kk";
import { requireAdminPage } from "@/lib/server/guards";
import { ArrowLeftIcon } from "lucide-react";
import moment from "moment";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-1 border-b py-2 md:flex-row md:items-center md:justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value || "-"}</span>
        </div>
    );
}

export default async function DetailKKAdminPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage();
    const { data } = await findPermohonanKKData(params);

    const statusMap: Record<string, { label: string; className: string }> = {
        DIAJUKAN: { label: "Menunggu Proses", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
        DISETUJUI: { label: "Disetujui", className: "bg-green-100 text-green-800 hover:bg-green-100" },
        DITOLAK: { label: "Ditolak", className: "bg-red-100 text-red-800 hover:bg-red-100" },
    };
    const status = statusMap[data.statusPermohonan] ?? statusMap.DIAJUKAN;

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <a href="/permohonan-kk"><ArrowLeftIcon className="w-4 h-4" /> Kembali</a>
                    </Button>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Detail Permohonan KK</h1>
                            <p className="text-sm text-muted-foreground">
                                {data.nomorPermohonan ?? "Nomor belum tersedia"} • Diajukan {moment(data.createdAt).format("DD MMMM YYYY HH:mm")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Pengaju: {data.user.name} ({data.user.email})
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={status.className}>{status.label}</Badge>
                            <KKUpdateStatus id={data.permohonanKKId} status={data.statusPermohonan} />
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                        <h2 className="mb-2 font-semibold">I. Data Pemohon</h2>
                        <Row label="Nama" value={data.nama} />
                        <Row label="NIK" value={data.nik} />
                        <Row label="No. KK Lama" value={data.noKKLama} />
                        <Row label="Alasan Permohonan" value={data.alasanPermohonan} />
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                        <h2 className="mb-2 font-semibold">II. Alamat</h2>
                        <Row label="Alamat" value={data.alamat} />
                        <Row label="RT / RW" value={`${data.rt} / ${data.rw}`} />
                        <Row label="Desa" value={data.desa} />
                        <Row label="Kecamatan" value={data.kecamatan} />
                        <Row label="Kabupaten" value={data.kabupaten} />
                        <Row label="Provinsi" value={data.provinsi} />
                        <Row label="Kode Pos" value={data.kodePos} />
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                        <h2 className="mb-2 font-semibold">III. Dokumen</h2>
                        <Row label="Scan KTP" value={data.dokumenKTP ? "Terunggah" : "-"} />
                        <Row label="Scan Akta" value={data.dokumenAkta ? "Terunggah" : "-"} />
                        <Row label="Surat Pengantar" value={data.dokumenPengantar ? "Terunggah" : "-"} />
                        <div className="mt-2 flex gap-4 text-sm">
                            {data.dokumenKTP && <a href={data.dokumenKTP} target="_blank" rel="noopener noreferrer" className="text-primary underline">Lihat KTP</a>}
                            {data.dokumenAkta && <a href={data.dokumenAkta} target="_blank" rel="noopener noreferrer" className="text-primary underline">Lihat Akta</a>}
                            {data.dokumenPengantar && <a href={data.dokumenPengantar} target="_blank" rel="noopener noreferrer" className="text-primary underline">Lihat Pengantar</a>}
                        </div>
                    </div>

                    {data.catatan && (
                        <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                            <h2 className="mb-2 font-semibold">📝 Catatan</h2>
                            <p className="text-sm text-muted-foreground">{data.catatan}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
