import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findPermohonanSaya } from "@/lib/server/services/permohonan-saya";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { FileText, PlusCircle } from "lucide-react";
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

const ajukanMenu = [
    { label: "Ajukan KTP", url: "/permohonan-ktp-mandiri/tambah" },
    { label: "Ajukan SKL", url: "/permohonan-skl-mandiri/tambah" },
    { label: "Ajukan SKTM", url: "/permohonan-sktm-mandiri/tambah" },
    { label: "Ajukan SKK", url: "/permohonan-skk-mandiri/tambah" },
    { label: "Ajukan SKU", url: "/permohonan-sku-mandiri/tambah" },
    { label: "Ajukan SKD", url: "/permohonan-skd-mandiri/tambah" },
];

export default async function PermohonanSayaPage() {
    const session = await findCurrentSessionService();
    if (!session?.user) redirect(PATHS.SIGN_IN);

    const { ktp, skl, sktm, skk, sku, skd, pindah } = await findPermohonanSaya(session.user.userId);

    type Item = { jenis: string; status: string; nomor: string | null; nama: string; createdAt: Date; catatan: string | null; detailUrl?: string };

    const items: Item[] = [
        ...ktp.map((k) => ({ jenis: "KTP", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan, detailUrl: `/permohonan-ktp/${k.permohonanKtpId}` })),
        ...skl.map((k) => ({ jenis: "SKL", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan })),
        ...sktm.map((k) => ({ jenis: "SKTM", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan })),
        ...skk.map((k) => ({ jenis: "SKK", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan })),
        ...sku.map((k) => ({ jenis: "SKU", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan })),
        ...skd.map((k) => ({ jenis: "SKD", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan })),
        ...pindah.map((k) => ({ jenis: "Surat Pindah", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan })),
        ...kk.map((k) => ({ jenis: "KK", status: k.statusPermohonan, nomor: k.nomorPermohonan, nama: k.nama, createdAt: k.createdAt, catatan: k.catatan })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold">Permohonan Saya</h1>
                        <p className="text-sm text-muted-foreground">
                            Semua permohonan Anda di satu tempat. Pilih jenis layanan untuk mengajukan yang baru.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {ajukanMenu.map((m) => (
                            <Button asChild key={m.url} variant="outline" size="sm">
                                <Link href={m.url}>
                                    <PlusCircle className="w-4 h-4 mr-1" />
                                    {m.label}
                                </Link>
                            </Button>
                        ))}
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                            <p className="font-medium">Belum ada permohonan</p>
                            <p className="text-sm text-muted-foreground">
                                Pilih salah satu tombol layanan di atas untuk mulai mengajukan.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {items.map((item, idx) => {
                                const status = statusConfig[item.status] ?? statusConfig.DIAJUKAN;
                                return (
                                    <div key={`${item.jenis}-${idx}`} className="rounded-xl border bg-card p-4 shadow-sm md:p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{item.jenis}</Badge>
                                                    <span className="font-semibold">
                                                        {item.nomor ?? "Nomor belum tersedia"}
                                                    </span>
                                                    <Badge variant="outline" className={status.className}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.nama} • Diajukan {moment(item.createdAt).format("DD MMMM YYYY HH:mm")}
                                                </p>
                                                {item.catatan && (
                                                    <p className="mt-1 rounded-md bg-muted p-2 text-xs">
                                                        <span className="font-semibold">Catatan petugas:</span> {item.catatan}
                                                    </p>
                                                )}
                                            </div>
                                            {item.detailUrl && (
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={item.detailUrl}>Lihat Detail</Link>
                                                </Button>
                                            )}
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
