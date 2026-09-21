import { PermohonanSKLUpdateForm } from "@/components/permohonan-skl-update-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findPermohonanSKLData } from "@/lib/server/data/permohonan-skl";
import { notFound } from "next/navigation";

interface EditPermohonanSKLPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPermohonanSKLPage({ params }: EditPermohonanSKLPageProps) {

  const { data } = await findPermohonanSKLData(params);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Edit Permohonan SKL</h1>
            <p className="text-muted-foreground">
              Silakan edit formulir di bawah ini untuk memperbarui permohonan Surat Keterangan Lahir.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Edit Permohonan SKL</CardTitle>
              <CardDescription>
                Perbarui data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermohonanSKLUpdateForm permohonanSKL={data} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
