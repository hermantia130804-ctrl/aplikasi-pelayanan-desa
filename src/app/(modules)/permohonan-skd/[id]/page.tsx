import { PermohonanSKDDetail } from "@/components/permohonan-skd-detail";
import { findPermohonanSKDData } from "@/lib/server/data/permohonan-skd";
import { Metadata } from "next";
import { SuratPDFDownloadButton } from "@/components/surat-pdf-download-button";

export const metadata: Metadata = {
    title: "Detail Permohonan SKD",
    description: "Detail permohonan Surat Keterangan Domisili",
};

interface PermohonanSKDDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function PermohonanSKDDetailPage({ params }: PermohonanSKDDetailPageProps) {
    const resolvedParams = await params;
    const { data: permohonan } = await findPermohonanSKDData(resolvedParams);

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold">Kelola Permohonan SKD</h1>
                            <p className="text-muted-foreground">
                                Kelola Permohonan SKD adalah fitur untuk mengelola permohonan Surat Keterangan Domisili yang terdaftar di aplikasi pelayanan desa Sukamaju.
                            </p>
                        </div>
                    </div>
                    {permohonan.statusPermohonan === "DISETUJUI" && (
                        <div className="flex justify-end mb-2">
                            <SuratPDFDownloadButton jenis="SKD" data={permohonan} />
                        </div>
                    )}
                    <PermohonanSKDDetail permohonanSKD={permohonan} />
                </div>
            </div>
        </div>
    );
}
