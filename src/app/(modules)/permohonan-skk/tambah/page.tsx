import { PermohonanSKKCreateForm } from "@/components/permohonan-skk-create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TambahPermohonanSKKPage() {

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Tambah Permohonan SKK</h1>
            <p className="text-muted-foreground">
              Silakan isi formulir di bawah ini untuk menambahkan permohonan Surat Keterangan Kematian baru.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Permohonan SKK</CardTitle>
              <CardDescription>
                Isi data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermohonanSKKCreateForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
