import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findManyPerbaikanDesilAction } from "@/lib/server/actions/perbaikan-desil";
import { PerbaikanDesilDeleteModal } from "@/components/perbaikan-desil-delete-modal";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import moment from "moment";

export const dynamic = "force-dynamic";

const badgeVarian: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DIAJUKAN: "secondary",
  DISETUJUI: "default",
  DITOLAK: "destructive",
};

export default async function KelolaPerbaikanDesilPage() {
    const res = await findManyPerbaikanDesilAction();
    const daftar = res.status === 200 ? res.data : [];

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold">Kelola Perbaikan Desil</h1>
                        <p className="text-muted-foreground">Daftar pengajuan pemutakhiran data sosial-ekonomi warga.</p>
                    </div>

                    {daftar.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                            Belum ada pengajuan warga.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {daftar.map((d) => (
                                <Link
                                    key={d.perbaikanDesilId}
                                    href={`/kelola-perbaikan-desil/${d.perbaikanDesilId}`}
                                    className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-bold">{d.nomorPermohonan}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {d.namaKk} · NIK {d.nikKk} · Pengaju: {d.user?.name ?? "-"} · {moment(d.createdAt).format("DD MMM YYYY")}
                                        </p>
                                    </div>
    <div className="flex items-center gap-2">
                                        <Badge variant={badgeVarian[d.statusPermohonan] ?? "outline"}>
                                            {d.statusPermohonan}
                                        </Badge>
                                        <PerbaikanDesilDeleteModal perbaikanDesilId={d.perbaikanDesilId} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
