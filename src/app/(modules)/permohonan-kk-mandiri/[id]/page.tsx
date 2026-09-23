import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { findPermohonanKKByIdService } from "@/lib/server/services/permohonan-kk";
import { ArrowLeftIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import moment from "moment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Detail Permohonan Saya | Aplikasi Pelayanan Desa Sukamaju",
};

const statusConfig: Record<string, { label: string; className: string }> = {
    DIAJUKAN: { label: "Menunggu Proses", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    DISETUJUI: { label: "Disetujui", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    DITOLAK: { label: "Ditolak", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

function Row({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-1 border-b py-2 md:flex-row md:items-center md:justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value || "-"}</span>
        </div>
    );
}

export default async function DetailPermohonanSayaKKPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await findCurrentSessionService();
    if (!session?.user) redirect("/masuk");

    const data = await findPermohonanKKByIdService(id);
    if (!data) redirect("/permohonan-saya");
    if (data.userId !== session.user.userId) redirect("/permohonan-saya");

    const status = statusConfig[data.statusPermohonan] ?? statusConfig.DIAJUKAN;

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/permohonan-saya"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Detail Permohonan KK</h1>
                            <p className="text-sm text-muted-foreground">
                                {data.nomorPermohonan ?? "Nomor belum tersedia"} • Diajukan {moment(data.createdAt).format("DD MMMM YYYY")}
                            </p>
                        </div>
                        <Badge variant="outline" className={status.className + " w-fit text-sm"}>{status.label}</Badge>
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
                        <Row label="Surat Pengantar RT/RW" value={data.dokumenPengantar ? "Terunggah" : "-"} />
                        {data.dokumenKTP && (
                            <a href={data.dokumenKTP} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary underline">
                                Lihat Scan KTP
                            </a>
                        )}
                    </div>

                    {data.catatan && (
                        <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                            <h2 className="mb-2 font-semibold">📝 Catatan Petugas</h2>
                            <p className="text-sm text-muted-foreground">{data.catatan}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
