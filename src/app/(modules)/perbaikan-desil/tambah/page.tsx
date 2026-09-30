import { PerbaikanDesilForm } from "@/components/perbaikan-desil-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TambahPerbaikanDesilPage() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/perbaikan-desil"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Formulir Perbaikan Desil</h1>
                    <p className="text-muted-foreground -mt-3">
                        Lengkapi data keluarga sesuai kondisi terkini. Tanda <span className="text-red-500">*</span> wajib diisi.
                    </p>
                    <div className="max-w-4xl">
                        <PerbaikanDesilForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
