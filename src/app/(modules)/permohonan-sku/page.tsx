import { permohonanSKUColumns } from "@/components/permohonan-sku-columns";
import { PermohonanSKUDataTable } from "@/components/permohonan-sku-data-table";
import { PermohonanSKUFilterTable } from "@/components/permohonan-sku-filter-table";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { findManyPermohonanSKUData } from "@/lib/server/data/permohonan-sku";
import Link from "next/link";

interface PermohonanSKUPageProps {
  searchParams: Promise<{ [key: string]: string }>;
}

export default async function PermohonanSKUPage({
  searchParams,
}: PermohonanSKUPageProps) {
  const { data, pagination } = await findManyPermohonanSKUData(searchParams);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Kelola Permohonan SKU</h1>
              <p className="text-muted-foreground">
                Kelola Permohonan SKU adalah fitur untuk mengelola permohonan SKU yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
            <Button asChild>
              <Link href={`${PATHS.SKU_REQUEST}/tambah`}>Tambah Permohonan SKU</Link>
            </Button>
          </div>
          <PermohonanSKUFilterTable />
          <PermohonanSKUDataTable columns={permohonanSKUColumns} data={data} pagination={pagination} />
        </div>
      </div>
    </div>
  );
}
