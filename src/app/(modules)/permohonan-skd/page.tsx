import { permohonanSKDColumns } from "@/components/permohonan-skd-columns";
import { PermohonanSKDDataTable } from "@/components/permohonan-skd-data-table";
import { PermohonanSKDFilterTable } from "@/components/permohonan-skd-filter-table";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findManyPermohonanSKDData } from "@/lib/server/data/permohonan-skd";
import Link from "next/link";

interface PermohonanSKDPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function PermohonanSKDPage({ searchParams }: PermohonanSKDPageProps) {
  const resolvedSearchParams = await searchParams;
  const { data, pagination } = await findManyPermohonanSKDData(resolvedSearchParams);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan SKD</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan SKD adalah fitur untuk mengelola permohonan Surat Keterangan Domisili yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={`${PATHS.SKD_REQUEST}/tambah`}>Tambah Permohonan SKD</Link>
            </Button>
          </div>
          <PermohonanSKDFilterTable />
          <PermohonanSKDDataTable columns={permohonanSKDColumns} data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}
