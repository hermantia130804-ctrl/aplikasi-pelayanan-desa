import { Button } from "@/components/ui/button";
import { StrukturDeleteButton } from "@/components/struktur-delete-button";
import { findManyStrukturService } from "@/lib/server/services/struktur-organisasi";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function KelolaStrukturPage() {
    const strukturList = await findManyStrukturService();

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold">Struktur Organisasi</h1>
                            <p className="text-muted-foreground">Kelola perangkat desa yang tampil di Beranda.</p>
                        </div>
                        <Button asChild>
                            <Link href="/struktur-organisasi/tambah">
                                <PlusCircle className="size-4 mr-1" /> Tambah
                            </Link>
                        </Button>
                    </div>

                    {strukturList.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                            Belum ada data. Klik "Tambah" untuk mengisi.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {strukturList.map((s) => (
                                <div key={s.strukturId} className="rounded-xl border bg-card p-5 shadow-sm text-center">
                                    <span className="text-xs font-bold text-muted-foreground">Urutan {s.urutan}</span>
                                    <div className="mt-3 mx-auto size-20 overflow-hidden rounded-full border bg-muted">
                                        {s.fotoUrl ? (
                                            <img src={s.fotoUrl} alt={s.nama} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-2xl">👤</div>
                                        )}
                                    </div>
                                    <h3 className="mt-3 font-bold">{s.nama}</h3>
                                    <p className="text-sm text-muted-foreground">{s.jabatan}</p>
                                    <div className="mt-4 flex gap-2">
                                        <Button asChild variant="outline" size="sm" className="flex-1">
                                            <Link href={`/struktur-organisasi/edit/${s.strukturId}`}>Edit</Link>
                                        </Button>
                                        <StrukturDeleteButton strukturId={s.strukturId} />
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