import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { FileX, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PermohonanSKDNotFoundPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileX className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>Permohonan SKD Tidak Ditemukan</CardTitle>
              <CardDescription>
                Permohonan SKD yang Anda cari tidak ditemukan atau mungkin telah dihapus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href={PATHS.SKD_REQUEST}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Daftar Permohonan
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`${PATHS.SKD_REQUEST}/tambah`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Permohonan Baru
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
