import { PermohonanSKKDataTable } from "@/components/permohonan-skk-data-table";
import { PermohonanSKKFilterTable } from "@/components/permohonan-skk-filter-table";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findManyPermohonanSKKData } from "@/lib/server/data/permohonan-skk";
import Link from "next/link";

interface PermohonanSKKPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function PermohonanSKKPage({ searchParams }: PermohonanSKKPageProps) {
  const { data, pagination } = await findManyPermohonanSKKData(searchParams);
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan SKK</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan SKK adalah fitur untuk mengelola permohonan Surat Keterangan Kematian yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={PATHS.SKK_REQUEST_CREATE}>Tambah Permohonan SKK</Link>
            </Button>
          </div>
          <PermohonanSKKFilterTable />
          <PermohonanSKKDataTable data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}
