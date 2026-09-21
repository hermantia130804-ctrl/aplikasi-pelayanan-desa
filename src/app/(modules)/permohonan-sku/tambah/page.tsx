import { PermohonanSKUCreateForm } from "@/components/permohonan-sku-create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Permohonan SKU",
  description: "Buat permohonan Surat Keterangan Usaha baru",
};

export default function PermohonanSKUCreatePage() {
  return (
    <div className="flex flex-1 flex-col">
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Tambah Permohonan SKU</h1>
          <p className="text-muted-foreground">
            Silakan isi formulir di bawah ini untuk menambahkan permohonan SKU baru.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Formulir Permohonan SKU</CardTitle>
            <CardDescription>
              Isi data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermohonanSKUCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}
