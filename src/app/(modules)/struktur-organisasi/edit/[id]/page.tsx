import { prisma } from "@/lib/prisma";
import { StrukturForm } from "@/components/struktur-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditStrukturPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await prisma.strukturOrganisasi.findUnique({ where: { strukturId: id } });
    if (!data) notFound();

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                    <Button asChild variant="outline" className="w-fit">
                        <Link href="/struktur-organisasi"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Struktur Organisasi</h1>
                    <StrukturForm
                        strukturId={data.strukturId}
                        defaultValues={{
                            nama: data.nama,
                            jabatan: data.jabatan,
                            fotoUrl: data.fotoUrl ?? "",
                            urutan: data.urutan,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
