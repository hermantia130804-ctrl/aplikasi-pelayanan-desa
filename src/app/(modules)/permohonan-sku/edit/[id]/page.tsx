import { PermohonanSKUUpdateForm } from "@/components/permohonan-sku-update-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findPermohonanSKUData } from "@/lib/server/data/permohonan-sku";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Permohonan SKU",
  description: "Edit permohonan Surat Keterangan Usaha",
};

interface PermohonanSKUEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PermohonanSKUEditPage({
  params,
}: PermohonanSKUEditPageProps) {
    const { data: permohonan } = await findPermohonanSKUData(params);
    return (
      <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Edit Permohonan SKU</h1>
            <p className="text-muted-foreground">
              Silakan edit formulir di bawah ini untuk memperbarui permohonan SKU.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Edit Permohonan SKU</CardTitle>
              <CardDescription>
                Perbarui data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermohonanSKUUpdateForm permohonan={permohonan} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
      );
}
