import { PermohonanKTPCreateForm } from "@/components/permohonan-ktp-create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TambahPermohonanKTPPage() {

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Tambah Permohonan KTP</h1>
            <p className="text-muted-foreground">
              Silakan isi formulir di bawah ini untuk menambahkan permohonan KTP baru.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Formulir Permohonan KTP</CardTitle>
              <CardDescription>
                Isi data dengan lengkap dan benar sesuai dengan dokumen yang dimiliki.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermohonanKTPCreateForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
