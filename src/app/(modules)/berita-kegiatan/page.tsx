import { Button } from "@/components/ui/button";
import { BeritaDeleteButton } from "@/components/berita-delete-button";
import { findManyBeritaService } from "@/lib/server/services/berita-kegiatan";
import { PlusCircle, PencilIcon } from "lucide-react";
import Link from "next/link";
import moment from "moment";

export const dynamic = "force-dynamic";

export default async function KelolaBeritaPage() {
    const beritaList = await findManyBeritaService();

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold">Kegiatan Desa (Berita)</h1>
                            <p className="text-muted-foreground">Kelola berita kegiatan yang tampil di Beranda Masyarakat.</p>
                        </div>
                        <Button asChild>
                            <Link href="/berita-kegiatan/tambah">
                                <PlusCircle className="size-4 mr-1" /> Tambah Berita
                            </Link>
                        </Button>
                    </div>

                    {beritaList.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                            Belum ada berita. Klik "Tambah Berita" untuk membuat.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {beritaList.map((b) => (
                                <div key={b.beritaId} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                                    {b.gambarUrl && (
    <img src={b.gambarUrl} alt={b.judul} className="h-40 w-full object-cover" />
)}
{!b.gambarUrl && b.youtubeId && (
    <img src={`https://img.youtube.com/vi/${b.youtubeId}/hqdefault.jpg`} alt={b.judul} className="h-40 w-full object-cover" />
)}
                                    <div className="p-4 flex flex-col gap-1">
                                        <p className="text-xs text-muted-foreground">
                                            📅 {moment(b.tanggalKegiatan).format("DD MMMM YYYY")} · ✍️ {b.penulis.name}
                                        </p>
                                        <h3 className="font-bold leading-snug">{b.judul}</h3>
                                        <p className="text-sm text-muted-foreground">{b.isi.slice(0, 100)}...</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Button asChild variant="outline" size="sm" className="flex-1">
                                                <Link href={`/berita-kegiatan/edit/${b.beritaId}`}>
                                                    <PencilIcon className="size-4 mr-1" /> Edit
                                                </Link>
                                            </Button>
                                            <BeritaDeleteButton beritaId={b.beritaId} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}