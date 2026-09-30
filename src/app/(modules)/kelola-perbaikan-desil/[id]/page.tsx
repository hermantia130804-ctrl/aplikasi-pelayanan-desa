import { PerbaikanDesilTindakLanjut } from "@/components/perbaikan-desil-tindak-lanjut";
import { findPerbaikanDesilByIdAction } from "@/lib/server/actions/perbaikan-desil";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KelolaPerbaikanDesilDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await findPerbaikanDesilByIdAction(id);
    if (res.status !== 200) notFound();
    const d = res.data;

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/kelola-perbaikan-desil"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Tindak Lanjut: {d.nomorPermohonan}</h1>
                    <p className="text-muted-foreground -mt-2">Pemohon: {d.user?.name ?? "-"} ({d.user?.email ?? "-"})</p>

                    {/* Detail lengkap = halaman detail warga, dirender ulang via data yang sama */}
                    <PerbaikanDesilTindakLanjut
                        perbaikanDesilId={d.perbaikanDesilId}
                        statusPermohonan={d.statusPermohonan}
                        catatan={d.catatan ?? ""}
                    />
                </div>
            </div>
        </div>
    );
}
