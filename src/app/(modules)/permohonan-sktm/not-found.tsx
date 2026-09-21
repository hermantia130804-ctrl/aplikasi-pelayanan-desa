import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { FileSearchIcon } from "lucide-react";
import Link from "next/link";

export default function PermohonanSKTMNotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <FileSearchIcon className="size-16 text-muted-foreground" />
              <div className="text-center">
                <h1 className="text-2xl font-bold">Permohonan SKTM tidak ditemukan</h1>
                <p className="text-muted-foreground mt-2">
                  Permohonan Surat Keterangan Tidak Mampu yang Anda cari tidak ditemukan atau mungkin telah dihapus.
                </p>
              </div>
              <Button asChild>
                <Link href={PATHS.SKTM_REQUEST}>
                  Kembali ke Daftar Permohonan SKTM
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
