import { CekBansosForm } from "@/components/cek-bansos-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CekBansosTambahPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 max-w-2xl">
          <Button asChild variant="outline" className="w-fit">
            <Link href="/cek-bansos"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link>
          </Button>
          <h1 className="text-2xl font-bold">Ajukan Cek Status Bansos</h1>
          <p className="text-muted-foreground -mt-2">Isi data keluarga dan unggah foto Kartu Keluarga (KK).</p>
          <CekBansosForm />
        </div>
      </div>
    </div>
  );
}
