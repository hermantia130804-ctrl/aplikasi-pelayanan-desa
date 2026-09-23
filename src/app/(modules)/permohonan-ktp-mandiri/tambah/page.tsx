import { Metadata } from "next";
import { PermohonanKTPMandiriForm } from "@/components/permohonan-ktp-mandiri-form";

export const metadata: Metadata = {
    title: "Ajukan Permohonan KTP | Aplikasi Pelayanan Desa Sukamaju",
};

export default function PermohonanKTPMandiriTambahPage() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold">Ajukan Permohonan KTP</h1>
                        <p className="text-sm text-muted-foreground">
                            Lengkapi formulir di bawah, unggah scan dokumen persyaratan, lalu kirim.
                            Permohonan Anda akan diproses oleh petugas desa.
                        </p>
                    </div>
                    <PermohonanKTPMandiriForm />
                </div>
            </div>
        </div>
    );
}
