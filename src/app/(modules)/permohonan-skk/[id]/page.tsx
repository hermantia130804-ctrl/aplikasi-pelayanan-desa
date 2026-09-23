import { PermohonanSKKDetail } from "@/components/permohonan-skk-detail";
import { findPermohonanSKKData } from "@/lib/server/data/permohonan-skk";
import { notFound } from "next/navigation";
import { SuratPDFDownloadButton } from "@/components/surat-pdf-download-button";

interface DetailPermohonanSKKPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPermohonanSKKPage({ params }: DetailPermohonanSKKPageProps) {
  const { data } = await findPermohonanSKKData(params);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Detail Permohonan SKK</h1>
              <p className="text-muted-foreground">
                Detail lengkap permohonan Surat Keterangan Kematian yang terdaftar di aplikasi pelayanan desa Sukamaju.
              </p>
            </div>
          </div>
          {data.statusPermohonan === "DISETUJUI" && (
            <div className="flex justify-end mb-2">
              <SuratPDFDownloadButton jenis="SKK" data={data} />
            </div>
          )}
          <PermohonanSKKDetail permohonanSKK={data} />
        </div>
      </div>
    </div>
  );
}
