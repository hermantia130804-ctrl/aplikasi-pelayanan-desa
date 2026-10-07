import { DataWargaForm } from "@/components/data-warga-form";
import { findDataWargaByIdAction } from "@/lib/server/actions/data-warga";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditDataWargaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await findDataWargaByIdAction(id);
    if (!("data" in res)) notFound();
    const d = res.data;
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit"><Link href="/data-warga"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link></Button>
                    <h1 className="text-2xl font-bold">Edit: {d.namaLengkap}</h1>
                    <DataWargaForm
                        dataWargaId={d.dataWargaId}
                        defaultValues={{
                            namaLengkap: d.namaLengkap,
                            nik: d.nik,
                            noKk: d.noKk,
                            jenisKelamin: d.jenisKelamin,
                            statusKeluarga: d.statusKeluarga,
                            tempatLahir: d.tempatLahir,
                            tanggalLahir: new Date(d.tanggalLahir).toISOString().slice(0, 10),
                            agama: d.agama,
                            pendidikan: d.pendidikan,
                            pekerjaan: d.pekerjaan,
                            statusPerkawinan: d.statusPerkawinan,
                            namaAyah: d.namaAyah,
                            namaIbu: d.namaIbu,
                            namaPanggilan: d.namaPanggilan ?? "",
                            noHp: d.noHp ?? "",
                            punyaKtp: d.punyaKtp,
                            bpjs: d.bpjs ?? "TIDAK",
                            desil: d.desil ?? "DESIL 1",
                            alamat: d.alamat,
                            keterangan: d.keterangan ?? "",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
