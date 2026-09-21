import { PermohonanSKTMDataTable } from "@/components/permohonan-sktm-data-table";
import { PermohonanSKTMFilterTable } from "@/components/permohonan-sktm-filter-table";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findManyPermohonanSKTMData } from "@/lib/server/data/permohonan-sktm";
import Link from "next/link";

interface PermohonanSKTMPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function PermohonanSKTMPage({ searchParams }: PermohonanSKTMPageProps) {
  const { data, pagination } = await findManyPermohonanSKTMData(searchParams);
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan SKTM</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan SKTM adalah fitur untuk mengelola permohonan Surat Keterangan Tidak Mampu yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={PATHS.SKTM_REQUEST_CREATE}>Tambah Permohonan SKTM</Link>
            </Button>
          </div>
          <PermohonanSKTMFilterTable />
          <PermohonanSKTMDataTable data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}
