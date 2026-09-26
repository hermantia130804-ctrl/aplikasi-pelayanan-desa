import { BeritaForm } from "@/components/berita-form";
import { Button } from "@/components/ui/button";
import { findBeritaByIdService } from "@/lib/server/services/berita-kegiatan";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditBeritaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data } = await findBeritaByIdService(id);
    if (!data) notFound();

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/berita-kegiatan"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Berita</h1>
                    <BeritaForm
                        beritaId={data.beritaId}
                        defaultValues={{
                            judul: data.judul,
                            isi: data.isi,
                            kategoriMedia: data.kategoriMedia,
                            gambarUrl: data.gambarUrl ?? "",
                            youtubeId: data.youtubeId ?? "",
                            tanggalKegiatan: new Date(data.tanggalKegiatan).toISOString().slice(0, 10),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}