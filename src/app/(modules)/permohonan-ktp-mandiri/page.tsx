import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findManyPermohonanKTPByUserService } from "@/lib/server/services/permohonan-ktp";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { PlusCircle, FileText } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import moment from "moment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Permohonan Saya | Aplikasi Pelayanan Desa Sukamaju",
};

const statusConfig: Record<string, { label: string; className: string }> = {
    DIAJUKAN: { label: "Menunggu Proses", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    DISETUJUI: { label: "Disetujui", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    DITOLAK: { label: "Ditolak", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export default async function PermohonanSayaPage() {
    const session = await findCurrentSessionService();
    if (!session?.user) redirect(PATHS.SIGN_IN);

    const permohonan = await findManyPermohonanKTPByUserService(session.user.userId);

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold">Permohonan Saya</h1>
                            <p className="text-sm text-muted-foreground">
                                Pantau status permohonan KTP yang telah Anda ajukan.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/permohonan-ktp-mandiri/tambah">
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Ajukan Permohonan Baru
                            </Link>
                        </Button>
                    </div>

                    {permohonan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                            <p className="font-medium">Belum ada permohonan</p>
                            <p className="text-sm text-muted-foreground">
                                Anda belum mengajukan permohonan KTP. Mulai dengan menekan tombol di atas.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {permohonan.map((item) => {
                                const status = statusConfig[item.statusPermohonan] ?? statusConfig.DIAJUKAN;
                                return (
                                    <div
                                        key={item.permohonanKtpId}
                                        className="rounded-xl border bg-card p-4 shadow-sm md:p-5"
                                    >
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
                                                    KTP {item.jenisPermohonanKTP.toLowerCase()} • {item.nama} • NIK {item.nik}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Diajukan {moment(item.createdAt).format("DD MMMM YYYY HH:mm")}
                                                </p>
                                                {item.catatan && (
                                                    <p className="mt-1 rounded-md bg-muted p-2 text-xs">
                                                        <span className="font-semibold">Catatan petugas:</span> {item.catatan}
                                                    </p>
                                                )}
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/permohonan-ktp/${item.permohonanKtpId}`}>
                                                    Lihat Detail
                                                </Link>
                                            </Button>
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
