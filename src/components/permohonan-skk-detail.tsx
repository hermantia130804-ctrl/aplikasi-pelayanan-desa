"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { PermohonanSKK } from "@/generated/prisma";
import { ArrowLeftIcon, EditIcon } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PermohonanSKKFollowUpModal } from "./permohonan-skk-follow-up-modal";

export type PermohonanSKKDetailProps = {
  permohonanSKK: PermohonanSKK;
};

const statusColors = {
  DIAJUKAN: "bg-yellow-100 text-yellow-800",
  DISETUJUI: "bg-green-100 text-green-800",
  DITOLAK: "bg-red-100 text-red-800",
};

const statusLabels = {
  DIAJUKAN: "Diajukan",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};


export function PermohonanSKKDetail({ permohonanSKK }: PermohonanSKKDetailProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(PATHS.SKK_REQUEST)}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <PermohonanSKKFollowUpModal
            permohonanSKKId={permohonanSKK.permohonanSKKId}
            nomorPermohonan={permohonanSKK.nomorPermohonan || ""}
            statusPermohonan={permohonanSKK.statusPermohonan}
            catatan={permohonanSKK.catatan || ""}
          />
          <Button asChild>
            <Link href={`${PATHS.SKK_REQUEST_EDIT}/${permohonanSKK.permohonanSKKId}`}>
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informasi Umum */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Umum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nomor Permohonan
              </label>
              <p className="font-medium">
                {permohonanSKK.nomorPermohonan || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                <Badge className={statusColors[permohonanSKK.statusPermohonan]}>
                  {statusLabels[permohonanSKK.statusPermohonan]}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tanggal Dibuat
              </label>
              <p className="font-medium">
                {moment(permohonanSKK.createdAt).format("DD MMMM YYYY, HH:mm")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Terakhir Diperbarui
              </label>
              <p className="font-medium">
                {moment(permohonanSKK.updatedAt).format("DD MMMM YYYY, HH:mm")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Almarhum */}
        <Card>
          <CardHeader>
            <CardTitle>Data Almarhum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                NIK
              </label>
              <p className="font-mono text-sm">{permohonanSKK.nik}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nama Lengkap
              </label>
              <p className="font-medium">{permohonanSKK.nama}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Agama
              </label>
              <p className="font-medium">{permohonanSKK.agama}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Umur
              </label>
              <p className="font-medium">{permohonanSKK.umur} tahun</p>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Kematian */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kematian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tanggal Meninggal
              </label>
              <p className="font-medium">
                {permohonanSKK.tanggalMeninggal
                  ? moment(permohonanSKK.tanggalMeninggal).format("DD MMMM YYYY")
                  : "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tempat Meninggal
              </label>
              <p className="font-medium">
                {permohonanSKK.tempatMeninggal || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alamat & Catatan */}
        <Card>
          <CardHeader>
            <CardTitle>Alamat & Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Alamat Lengkap
              </label>
              <p className="font-medium">{permohonanSKK.alamat}</p>
            </div>
            {permohonanSKK.catatan && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Catatan
                </label>
                <p className="font-medium">{permohonanSKK.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
