import { PermohonanKTPDataTable } from "@/components/permohonan-ktp-data-table";
import { PermohonanKTPFilterTable } from "@/components/permohonan-ktp-filter-table";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findManyPermohonanKTPData } from "@/lib/server/data/permohonan-ktp";
import Link from "next/link";

interface PermohonanKTPPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function PermohonanKTPPage({ searchParams }: PermohonanKTPPageProps) {
  const { data, pagination } = await findManyPermohonanKTPData(searchParams);
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan KTP</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan KTP adalah fitur untuk mengelola permohonan KTP yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={`${PATHS.KTP_REQUEST}/tambah`}>Tambah Permohonan KTP</Link>
            </Button>
          </div>
          <PermohonanKTPFilterTable />
          <PermohonanKTPDataTable data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}

