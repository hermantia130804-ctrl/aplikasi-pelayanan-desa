import { PermohonanSKUDetail } from "@/components/permohonan-sku-detail";
import { findPermohonanSKUData } from "@/lib/server/data/permohonan-sku";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Detail Permohonan SKU",
    description: "Detail permohonan Surat Keterangan Usaha",
};

interface PermohonanSKUDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function PermohonanSKUDetailPage({
    params,
}: PermohonanSKUDetailPageProps) {
    const { data: permohonan } = await findPermohonanSKUData(params);

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold">Kelola Permohonan SKU</h1>
                            <p className="text-muted-foreground">
                                Kelola Permohonan SKU adalah fitur untuk mengelola permohonan Surat Keterangan Usaha yang terdaftar di aplikasi pelayanan desa Sukamaju.
                            </p>
                        </div>
                    </div>
                    <PermohonanSKUDetail permohonan={permohonan} />
                </div>
            </div>
        </div>
    );
}
