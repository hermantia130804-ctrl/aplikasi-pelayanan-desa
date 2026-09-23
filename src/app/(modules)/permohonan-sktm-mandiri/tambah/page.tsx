import { Metadata } from "next";
import { PermohonanSKTMCreateForm } from "@/components/permohonan-sktm-create-form";

export const metadata: Metadata = {
    title: "Ajukan Permohonan SKTM | Aplikasi Pelayanan Desa Sukamaju",
};

export default function Page() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold">Ajukan Permohonan SKTM</h1>
                        <p className="text-sm text-muted-foreground">
                            Lengkapi formulir, unggah dokumen persyaratan (jika ada), lalu kirim.
                            Permohonan Anda akan diproses oleh petugas desa.
                        </p>
                    </div>
                    <PermohonanSKTMCreateForm />
                </div>
            </div>
        </div>
    );
}
