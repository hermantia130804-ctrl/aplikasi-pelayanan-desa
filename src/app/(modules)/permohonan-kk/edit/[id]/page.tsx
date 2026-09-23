import { PermohonanKKUpdateForm } from "@/components/permohonan-kk-update-form";
import { findPermohonanKKData } from "@/lib/server/data/permohonan-kk";
import { requireAdminPage } from "@/lib/server/guards";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditKKAdminPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminPage();
    const { id } = await params;
    const { data } = await findPermohonanKKData({ id });

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <a href="/permohonan-kk"><ArrowLeftIcon className="w-4 h-4" /> Kembali</a>
                    </Button>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold">Edit Permohonan KK</h1>
                        <p className="text-sm text-muted-foreground">
                            {data.nomorPermohonan ?? "Nomor belum tersedia"} • {data.nama}
                        </p>
                    </div>
                    <PermohonanKKUpdateForm
                        permohonanKKId={data.permohonanKKId}
                        defaultValues={{
                            nama: data.nama,
                            nik: data.nik,
                            noKKLama: data.noKKLama ?? "",
                            alasanPermohonan: data.alasanPermohonan,
                            alamat: data.alamat,
                            rt: data.rt,
                            rw: data.rw,
                            desa: data.desa,
                            kecamatan: data.kecamatan,
                            kabupaten: data.kabupaten,
                            provinsi: data.provinsi,
                            kodePos: data.kodePos,
                            dokumenAkta: data.dokumenAkta ?? "",
                            dokumenKTP: data.dokumenKTP ?? "",
                            dokumenPengantar: data.dokumenPengantar ?? "",
                            catatan: data.catatan ?? "",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
