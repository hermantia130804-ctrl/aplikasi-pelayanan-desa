import { PermohonanSKKUpdateForm } from "@/components/permohonan-skk-update-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findPermohonanSKKData } from "@/lib/server/data/permohonan-skk";
import { notFound } from "next/navigation";

interface EditPermohonanSKKPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPermohonanSKKPage({ params }: EditPermohonanSKKPageProps) {

  const { data } = await findPermohonanSKKData(params);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Edit Permohonan SKK</h1>
            <p className="text-muted-foreground">
              Silakan edit formulir di bawah ini untuk memperbarui permohonan Surat Keterangan Kematian.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Edit Permohonan SKK</CardTitle>
              <CardDescription>
                Perbarui data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermohonanSKKUpdateForm permohonanSKK={data} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
