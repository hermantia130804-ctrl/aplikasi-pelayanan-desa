import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowLeftIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Detail Permohonan Saya | Aplikasi Pelayanan Desa Sukamaju",
};

const statusConfig: Record<string, { label: string; className: string }> = {
    DIAJUKAN: { label: "Menunggu Proses", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    DIPROSES: { label: "Diproses", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
    DISETUJUI: { label: "Disetujui", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    DITOLAK: { label: "Ditolak", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

function fmt(date: Date | string | null | undefined, pattern: string) {
    if (!date) return "-";
    return format(new Date(date), pattern, { locale: id });
}

function Row({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col gap-1 border-b py-2 md:flex-row md:items-center md:justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value || "-"}</span>
        </div>
    );
}

export default async function DetailPermohonanSayaSKLPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await findCurrentSessionService();
    if (!session?.user) redirect("/masuk");

    const data = await prisma.permohonanSKL.findUnique({ where: { permohonanSKLId: id } });
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
                            <h1 className="text-2xl font-bold">Detail Permohonan SKL</h1>
                            <p className="text-sm text-muted-foreground">
                                {data.nomorPermohonan ?? "Nomor belum tersedia"} • Diajukan {fmt(data.createdAt, "dd MMMM yyyy")}
                            </p>
                        </div>
                        <Badge variant="outline" className={status.className + " w-fit text-sm"}>{status.label}</Badge>
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                        <h2 className="mb-2 font-semibold">I. Data Anak</h2>
                        <Row label="Nama Lengkap" value={data.nama} />
                        <Row label="Jenis Kelamin" value={data.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} />
                        <Row label="Tempat Lahir" value={data.tempatLahir} />
                        <Row label="Tanggal Lahir" value={fmt(data.tanggalLahir, "dd MMMM yyyy")} />
                        <Row label="Alamat" value={data.alamat} />
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                        <h2 className="mb-2 font-semibold">II. Data Ayah</h2>
                        <Row label="Nama Ayah" value={data.namaAyah} />
                        <Row label="NIK Ayah" value={data.nikAyah} />
                        <Row label="Pekerjaan" value={data.pekerjaanAyah} />
                        <Row label="Tempat Lahir" value={data.tempatLahirAyah} />
                        <Row label="Tanggal Lahir" value={fmt(data.tanggalLahirAyah, "dd MMMM yyyy")} />
                        <Row label="Agama" value={data.agamaAyah} />
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                        <h2 className="mb-2 font-semibold">III. Data Ibu</h2>
                        <Row label="Nama Ibu" value={data.namaIbu} />
                        <Row label="NIK Ibu" value={data.nikIbu} />
                        <Row label="Pekerjaan" value={data.pekerjaanIbu} />
                        <Row label="Tempat Lahir" value={data.tempatLahirIbu} />
                        <Row label="Tanggal Lahir" value={fmt(data.tanggalLahirIbu, "dd MMMM yyyy")} />
                        <Row label="Agama" value={data.agamaIbu} />
                    </div>

                    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                        <h2 className="mb-2 font-semibold">IV. Dokumen</h2>
                        <Row label="Scan Kartu Keluarga" value={data.dokumenKK ? "Terunggah" : "-"} />
                        <Row label="Surat Pengantar RT/RW" value={data.dokumenPengantar ? "Terunggah" : "-"} />
                        <Row label="Dokumen Surat Lahir" value={data.dokumenSuratLahir ? "Terunggah" : "-"} />
                        {data.dokumenKK && (
                            <a href={`/api/berkas?jenis=skl&id=${data.permohonanSKLId}&field=dokumenKK`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary underline">Lihat Dokumen KK</a>
                        )}
                        {data.dokumenPengantar && (
                            <a href={`/api/berkas?jenis=skl&id=${data.permohonanSKLId}&field=dokumenPengantar`} target="_blank" rel="noopener noreferrer" className="ml-4 inline-block text-sm text-primary underline">Lihat Surat Pengantar</a>
                        )}
                        {data.dokumenSuratLahir && (
                            <a href={`/api/berkas?jenis=skl&id=${data.permohonanSKLId}&field=dokumenSuratLahir`} target="_blank" rel="noopener noreferrer" className="ml-4 inline-block text-sm text-primary underline">Lihat Surat Lahir</a>
                        )}
                    </div>

                    {data.catatan && (
                        <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                            <h2 className="mb-2 font-semibold">📝 Catatan Petugas</h2>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.catatan}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
