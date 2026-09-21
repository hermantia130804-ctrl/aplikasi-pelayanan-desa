import { PermohonanSKDUpdateForm } from "@/components/permohonan-skd-update-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findPermohonanSKDData } from "@/lib/server/data/permohonan-skd";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Permohonan SKD",
  description: "Edit permohonan Surat Keterangan Domisili",
};

interface PermohonanSKDEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PermohonanSKDEditPage({
  params,
}: PermohonanSKDEditPageProps) {
    const resolvedParams = await params;
    const { data: permohonan } = await findPermohonanSKDData(resolvedParams);
    return (
      <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Edit Permohonan SKD</h1>
            <p className="text-muted-foreground">
              Silakan edit formulir di bawah ini untuk memperbarui permohonan SKD.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Edit Permohonan SKD</CardTitle>
              <CardDescription>
                Perbarui data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermohonanSKDUpdateForm permohonan={permohonan} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
      );
}
