import { BeritaForm } from "@/components/berita-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TambahBeritaPage() {
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/berita-kegiatan"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Tambah Berita Kegiatan</h1>
                    <BeritaForm
                        defaultValues={{
                            judul: "",
                            isi: "",
                            kategoriMedia: "GAMBAR",
                            gambarUrl: "",
                            youtubeId: "",
                            tanggalKegiatan: new Date().toISOString().slice(0, 10),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}