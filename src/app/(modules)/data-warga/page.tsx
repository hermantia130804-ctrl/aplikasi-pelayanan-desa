import { Button } from "@/components/ui/button";
import { findManyDataWargaAction } from "@/lib/server/actions/data-warga";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { findCurrentSessionService } from "@/lib/server/services/session";

export const dynamic = "force-dynamic";

export default async function DataWargaPage() {
    const session = await findCurrentSessionService();
    const isStaff = session?.user.role === "ADMIN" || session?.user.role === "PETUGAS";
    const res = await findManyDataWargaAction();
    const daftar = "data" in res ? res.data : [];

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-row justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Kelola Data Warga</h1>
                            <p className="text-muted-foreground">{isStaff ? "Data warga seluruh RT" : "Data warga wilayah RT Anda"}</p>
                        </div>
                        {session?.user.role === "RT" && (
                            <Button asChild><Link href="/data-warga/tambah"><PlusCircle className="size-4 mr-1" /> Tambah Warga</Link></Button>
                        )}
                    </div>
                    {daftar.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">Belum ada data warga.</div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border bg-card">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50 text-left"><tr>
                                    <th className="p-3">NIK</th><th className="p-3">Nama</th><th className="p-3">Jenis Kelamin</th><th className="p-3">Alamat</th>
                                    {isStaff && <th className="p-3">RT/RW</th>}<th className="p-3">Aksi</th>
                                </tr></thead>
                                <tbody>
                                    {daftar.map((d) => (
                                        <tr key={d.dataWargaId} className="border-b last:border-0">
                                            <td className="p-3 font-medium">{d.nik}</td>
                                            <td className="p-3">{d.namaLengkap}</td>
                                            <td className="p-3">{d.jenisKelamin}</td>
                                            <td className="p-3">{d.alamat}</td>
                                            {isStaff && <td className="p-3">RT {d.noRt} / RW {d.noRw}</td>}
                                            <td className="p-3"><div className="flex gap-2">
                                                <Link href={`/data-warga/${d.dataWargaId}/edit`} className="text-primary underline">Edit</Link>
                                                <Link href={`/data-warga/${d.dataWargaId}`} className="text-muted-foreground underline">Detail</Link>
                                            </div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
