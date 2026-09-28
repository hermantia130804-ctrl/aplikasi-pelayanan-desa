import { StrukturForm } from "@/components/struktur-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TambahStrukturPage() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/struktur-organisasi"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Tambah Struktur Organisasi</h1>
                    <StrukturForm
                        defaultValues={{
                            nama: "",
                            jabatan: "",
                            fotoUrl: "",
                            urutan: 1,
                            tingkat: 1,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
