import { PermohonanKKDataTable } from "@/components/permohonan-kk-data-table";
import { PermohonanKKFilterTable } from "@/components/permohonan-kk-filter-table";
import { Button } from "@/components/ui/button";
import { findManyPermohonanKKData } from "@/lib/server/data/permohonan-kk";
import Link from "next/link";

interface PermohonanKKPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export const dynamic = "force-dynamic";

export default async function PermohonanKKPage({ searchParams }: PermohonanKKPageProps) {
  const { data, pagination } = await findManyPermohonanKKData(searchParams);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan KK</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan KK adalah fitur untuk mengelola permohonan KK yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href="/permohonan-kk-mandiri/tambah">Tambah Permohonan KK</Link>
            </Button>
          </div>
          <PermohonanKKFilterTable />
          <PermohonanKKDataTable data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}
