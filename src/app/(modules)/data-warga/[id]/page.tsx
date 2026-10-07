import { findDataWargaByIdAction } from "@/lib/server/actions/data-warga";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function Baris({ label, value }: { label: string; value?: string | number | null }) {
    if (value === undefined || value === null || value === "") return null;
    return (<div className="flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
    </div>);
}

export default async function DetailDataWargaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await findDataWargaByIdAction(id);
    if (!("data" in res)) notFound();
    const d = res.data;
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit"><Link href="/data-warga"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link></Button>
                    <h1 className="text-2xl font-bold">{d.namaLengkap}</h1>
                    <p className="text-muted-foreground -mt-2">NIK: {d.nik} · RT {d.noRt} / RW {d.noRw}</p>
                    <div className="rounded-2xl border bg-card p-5"><h2 className="mb-2 font-bold">Identitas</h2>
                        <Baris label="No. KK" value={d.noKk} /><Baris label="Jenis Kelamin" value={d.jenisKelamin} />
                        <Baris label="Status Keluarga" value={d.statusKeluarga} />
                        <Baris label="TTL" value={`${d.tempatLahir}, ${new Date(d.tanggalLahir).toLocaleDateString("id-ID")}`} />
                        <Baris label="Agama" value={d.agama} /><Baris label="Pendidikan" value={d.pendidikan} />
                        <Baris label="Pekerjaan" value={d.pekerjaan} /><Baris label="Status Perkawinan" value={d.statusPerkawinan} />
                        <Baris label="Nama Ayah" value={d.namaAyah} /><Baris label="Nama Ibu" value={d.namaIbu} />
                        <Baris label="No. HP" value={d.noHp} /><Baris label="Alamat" value={d.alamat} />
                    </div>
                    <div className="rounded-2xl border bg-card p-5"><h2 className="mb-2 font-bold">Kesejahteraan</h2>
                        <Baris label="Punya KTP" value={d.punyaKtp} /><Baris label="BPJS" value={d.bpjs} />
                        <Baris label="Desil" value={d.desil} />
                        <Baris label="Bantuan" value={Array.isArray(d.bantuan) ? d.bantuan.join(", ") : String(d.bantuan ?? "-")} />
                        <Baris label="Keterangan" value={d.keterangan} />
                    </div>
                </div>
            </div>
        </div>
    );
}
