import { DataWargaForm } from "@/components/data-warga-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TambahDataWargaPage() {
    const session = await findCurrentSessionService();
    const role = session?.user.role ?? "USER";
    // ADMIN / Kasi Pemerintahan: boleh pilih RT/RW di form. RT: auto dari profil.
    let canPickWilayah = false;
    if (role === "ADMIN") {
        canPickWilayah = true;
    } else if (role === "PETUGAS") {
        const me = await prisma.user.findUnique({
            where: { userId: session!.user.userId },
            select: { jabatan: true },
        });
        canPickWilayah = me?.jabatan === "Kasi Pemerintahan";
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit"><Link href="/data-warga"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link></Button>
                    <h1 className="text-2xl font-bold">Tambah Data Warga</h1>
                    <DataWargaForm defaultValues={{}} canPickWilayah={canPickWilayah} />
                </div>
            </div>
        </div>
    );
}
