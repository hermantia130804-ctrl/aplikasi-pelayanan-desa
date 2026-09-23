import { Badge } from "@/components/ui/badge";
import { KKUpdateStatus } from "@/components/permohonan-kk-update-status";
import { findManyPermohonanKKService } from "@/lib/server/services/permohonan-kk";
import { Metadata } from "next";
import moment from "moment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Kelola Permohonan KK | Aplikasi Pelayanan Desa Sukamaju",
};

const statusConfig: Record<string, { label: string; className: string }> = {
    DIAJUKAN: { label: "Menunggu Proses", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    DISETUJUI: { label: "Disetujui", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    DITOLAK: { label: "Ditolak", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export default async function KelolaKKPage() {
    const permohonan = await findManyPermohonanKKService();

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold">Kelola Permohonan KK</h1>
                        <p className="text-sm text-muted-foreground">
                            Total {permohonan.length} permohonan • Klik badge status untuk memproses.
                        </p>
                    </div>

                    {permohonan.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                            Belum ada permohonan KK masuk.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {permohonan.map((item) => {
                                const status = statusConfig[item.statusPermohonan] ?? statusConfig.DIAJUKAN;
                                return (
                                    <div key={item.permohonanKKId} className="rounded-xl border bg-card p-4 shadow-sm md:p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">
                                                        {item.nomorPermohonan ?? "Nomor belum tersedia"}
                                                    </span>
                                                    <Badge variant="outline" className={status.className}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.nama} • NIK {item.nik} • Pengaju: {item.user.name} ({item.user.email})
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Alasan: {item.alasanPermohonan} • {moment(item.createdAt).format("DD MMM YYYY HH:mm")}
                                                </p>
                                                {item.catatan && (
                                                    <p className="mt-1 rounded-md bg-muted p-2 text-xs">
                                                        <span className="font-semibold">Catatan:</span> {item.catatan}
                                                    </p>
                                                )}
                                            </div>
                                            <KKUpdateStatus id={item.permohonanKKId} status={item.statusPermohonan} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
