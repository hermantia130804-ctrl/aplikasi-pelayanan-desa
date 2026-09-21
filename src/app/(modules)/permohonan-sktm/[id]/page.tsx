import { PermohonanSKTMDetail } from "@/components/permohonan-sktm-detail";
import { findPermohonanSKTMData } from "@/lib/server/data/permohonan-sktm";
import { notFound } from "next/navigation";

interface DetailPermohonanSKTMPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPermohonanSKTMPage({ params }: DetailPermohonanSKTMPageProps) {
  const { data } = await findPermohonanSKTMData(params);
  
  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Detail Permohonan SKTM</h1>
              <p className="text-muted-foreground">
                Detail lengkap permohonan Surat Keterangan Tidak Mampu yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
          </div>
          <PermohonanSKTMDetail permohonanSKTM={data} />
        </div>
      </div>
    </div>
  );
}
