import { PermohonanSKLDataTable } from "@/components/permohonan-skl-data-table";
import { PermohonanSKLFilterTable } from "@/components/permohonan-skl-filter-table";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findManyPermohonanSKLData } from "@/lib/server/data/permohonan-skl";
import Link from "next/link";

interface PermohonanSKLPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function PermohonanSKLPage({ searchParams }: PermohonanSKLPageProps) {
  const { data, pagination } = await findManyPermohonanSKLData(searchParams);
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan SKL</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan SKL adalah fitur untuk mengelola permohonan Surat Keterangan Lahir yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={PATHS.SKL_REQUEST_CREATE}>Tambah Permohonan SKL</Link>
            </Button>
          </div>
          <PermohonanSKLFilterTable />
          <PermohonanSKLDataTable data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}
