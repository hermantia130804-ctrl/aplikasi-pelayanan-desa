import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findManyPerbaikanDesilByUserAction } from "@/lib/server/actions/perbaikan-desil";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import moment from "moment";

export const dynamic = "force-dynamic";

const badgeVarian: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DIAJUKAN: "secondary",
  DISETUJUI: "default",
  DITOLAK: "destructive",
};

export default async function PerbaikanDesilPage() {
    const res = await findManyPerbaikanDesilByUserAction();
    const daftar = "data" in res ? res.data : [];

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold">Ajukan Perbaikan Desil</h1>
                            <p className="text-muted-foreground">
                                Pengajuan pemutakhiran data sosial-ekonomi keluarga Anda.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/perbaikan-desil/tambah">
                                <PlusCircle className="size-4 mr-1" /> Ajukan
                            </Link>
                        </Button>
                    </div>

                    {daftar.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                            Belum ada pengajuan. Klik "Ajukan" untuk membuat.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {daftar.map((d) => (
                                <Link
                                    key={d.perbaikanDesilId}
                                    href={`/perbaikan-desil/${d.perbaikanDesilId}`}
                                    className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-bold">{d.nomorPermohonan}</p>
                                        <p className="text-sm text-muted-foreground">
                                            KK a.n. {d.namaKk} · {d.jumlahAnggota} anggota · Diajukan {moment(d.createdAt).format("DD MMMM YYYY")}
                                        </p>
                                    </div>
                                    <Badge variant={badgeVarian[d.statusPermohonan] ?? "outline"}>
                                        {d.statusPermohonan}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
