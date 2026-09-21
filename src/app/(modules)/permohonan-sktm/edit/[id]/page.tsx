import { PermohonanSKTMUpdateForm } from "@/components/permohonan-sktm-update-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findPermohonanSKTMData } from "@/lib/server/data/permohonan-sktm";
import { notFound } from "next/navigation";

interface EditPermohonanSKTMPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPermohonanSKTMPage({ params }: EditPermohonanSKTMPageProps) {

  const { data } = await findPermohonanSKTMData(params);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Edit Permohonan SKTM</h1>
            <p className="text-muted-foreground">
              Silakan edit formulir di bawah ini untuk memperbarui permohonan Surat Keterangan Tidak Mampu.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Edit Permohonan SKTM</CardTitle>
              <CardDescription>
                Perbarui data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermohonanSKTMUpdateForm permohonanSKTM={data} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
