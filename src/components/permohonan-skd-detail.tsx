"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { PermohonanSKD } from "@/generated/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PermohonanSKDFollowUpModal } from "./permohonan-skd-follow-up-modal";

type PermohonanSKDWithUser = PermohonanSKD & {
  user: {
    userId: string;
    name: string;
    email: string;
  };
};

interface PermohonanSKDDetailProps {
  permohonan: PermohonanSKDWithUser;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "DIAJUKAN":
      return <Badge variant="secondary">Diajukan</Badge>;
    case "DISETUJUI":
      return <Badge variant="default">Disetujui</Badge>;
    case "DITOLAK":
      return <Badge variant="destructive">Ditolak</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function PermohonanSKDDetail({ permohonan }: PermohonanSKDDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
       
        <div className="flex gap-2">
          <PermohonanSKDFollowUpModal permohonan={permohonan} />
          <Button asChild>
            <Link href={`${PATHS.SKD_REQUEST}/edit/${permohonan.permohonanSKDId}`}>
              <Edit className="mr-2 h-4 w-4" />
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
              <label className="text-sm font-medium text-muted-foreground">Status Permohonan</label>
              <div className="mt-1">
                {getStatusBadge(permohonan.statusPermohonan)}
              </div>
            </div>
            
            {permohonan.nomorPermohonan && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nomor Permohonan</label>
                <p className="mt-1 font-mono text-sm">{permohonan.nomorPermohonan}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</label>
              <p className="mt-1">{format(permohonan.createdAt, "dd MMMM yyyy 'pukul' HH:mm", { locale: id })}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</label>
              <p className="mt-1">{format(permohonan.updatedAt, "dd MMMM yyyy 'pukul' HH:mm", { locale: id })}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tanggal Kedaluwarsa</label>
              <p className="mt-1">{format(permohonan.expiresAt, "dd MMMM yyyy", { locale: id })}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Dibuat oleh</label>
              <p className="mt-1">{permohonan.user.name}</p>
              <p className="text-sm text-muted-foreground">{permohonan.user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Pribadi */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIK</label>
              <p className="mt-1 font-mono">{permohonan.nik}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="mt-1 font-medium">{permohonan.nama}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Alamat KTP</label>
              <p className="mt-1">{permohonan.alamatKTP}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Alamat Domisili</label>
              <p className="mt-1">{permohonan.alamatDomisili}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tempat Lahir</label>
                <p className="mt-1">{permohonan.tempatLahir}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tanggal Lahir</label>
                <p className="mt-1">{format(permohonan.tanggalLahir, "dd MMMM yyyy", { locale: id })}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Jenis Kelamin</label>
                <p className="mt-1">{permohonan.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Agama</label>
                <p className="mt-1">{permohonan.agama}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Warga Negara</label>
                <Badge variant="outline">{permohonan.wargaNegara}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dokumen */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen Pendukung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {permohonan.dokumenKK && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dokumen KK</label>
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={permohonan.dokumenKK} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Lihat Dokumen KK
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {permohonan.dokumenKTP && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dokumen KTP</label>
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={permohonan.dokumenKTP} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Lihat Dokumen KTP
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {permohonan.dokumenSP && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dokumen Surat Pengantar</label>
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={permohonan.dokumenSP} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Lihat Surat Pengantar
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {!permohonan.dokumenKK && !permohonan.dokumenKTP && !permohonan.dokumenSP && (
              <p className="text-sm text-muted-foreground">Tidak ada dokumen yang diunggah.</p>
            )}
          </CardContent>
        </Card>

        {/* Catatan */}
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            {permohonan.catatan ? (
              <p className="text-sm">{permohonan.catatan}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada catatan.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
