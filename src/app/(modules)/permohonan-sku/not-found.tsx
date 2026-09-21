import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { FileX, Home } from "lucide-react";
import Link from "next/link";

export default function PermohonanSKUNotFound() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <FileX className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle>Permohonan SKU Tidak Ditemukan</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            Permohonan Surat Keterangan Usaha yang Anda cari tidak ditemukan atau
            mungkin telah dihapus.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href={PATHS.SKU_REQUEST}>
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Daftar
              </Link>
            </Button>
            <Button asChild>
              <Link href={PATHS.SKU_REQUEST_CREATE}>
                Buat Permohonan Baru
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
