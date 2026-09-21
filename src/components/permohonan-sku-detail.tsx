"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { PermohonanSKU } from "@/generated/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PermohonanSKUFollowUpModal } from "./permohonan-sku-follow-up-modal";

type PermohonanSKUWithUser = PermohonanSKU & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
};

interface PermohonanSKUDetailProps {
  permohonan: PermohonanSKUWithUser;
}

export function PermohonanSKUDetail({ permohonan }: PermohonanSKUDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DIAJUKAN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DIPROSES":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DISETUJUI":
        return "bg-green-100 text-green-800 border-green-200";
      case "DITOLAK":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
       
        <div className="flex gap-2">
          <PermohonanSKUFollowUpModal permohonan={permohonan} />
          <Button asChild>
            <Link href={`${PATHS.SKU_REQUEST_EDIT}/${permohonan.permohonanSKUId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info Umum */}
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
                {permohonan.nomorPermohonan || "Belum ada nomor"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status Permohonan
              </label>
              <div className="mt-1">
                <Badge variant="outline" className={getStatusColor(permohonan.statusPermohonan)}>
                  {permohonan.statusPermohonan}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tanggal Dibuat
              </label>
              <p className="font-medium">
                {format(permohonan.createdAt, "dd MMMM yyyy, HH:mm", { locale: id })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tanggal Kadaluarsa
              </label>
              <p className="font-medium">
                {format(permohonan.expiresAt, "dd MMMM yyyy", { locale: id })}
              </p>
            </div>
            {permohonan.catatan && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Catatan
                </label>
                <p className="font-medium">{permohonan.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Pribadi */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nama Lengkap
              </label>
              <p className="font-medium">{permohonan.nama}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                NIK
              </label>
              <p className="font-medium font-mono">{permohonan.nik}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tempat, Tanggal Lahir
              </label>
              <p className="font-medium">
                {permohonan.tempatLahir}, {format(permohonan.tanggalLahir, "dd MMMM yyyy", { locale: id })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Jenis Kelamin
              </label>
              <p className="font-medium">
                {permohonan.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Alamat
              </label>
              <p className="font-medium">{permohonan.alamat}</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Usaha */}
        <Card>
          <CardHeader>
            <CardTitle>Data Usaha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Jenis Usaha
              </label>
              <p className="font-medium">{permohonan.jenisUsaha}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tahun Berdiri Usaha
              </label>
              <p className="font-medium">{permohonan.tahunBerdiriUsaha}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Lokasi Usaha
              </label>
              <p className="font-medium">{permohonan.lokasiUsaha}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dokumen Pendukung */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen Pendukung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Dokumen Kartu Keluarga
              </label>
              {permohonan.dokumenKK ? (
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={permohonan.dokumenKK} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Lihat Dokumen
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada dokumen</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Dokumen KTP
              </label>
              {permohonan.dokumenKTP ? (
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={permohonan.dokumenKTP} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Lihat Dokumen
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada dokumen</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Dokumen Surat Pengantar
              </label>
              {permohonan.dokumenSP ? (
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={permohonan.dokumenSP} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Lihat Dokumen
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada dokumen</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Dokumen Usaha
              </label>
              {permohonan.dokumenUsaha ? (
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={permohonan.dokumenUsaha} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Lihat Dokumen
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada dokumen</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
