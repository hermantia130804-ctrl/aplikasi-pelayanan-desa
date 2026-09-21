"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { PermohonanPindah } from "@/generated/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Edit, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { PermohonanPindahFollowUpModal } from "./permohonan-pindah-follow-up-modal";

type PermohonanPindahWithUser = PermohonanPindah & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  permohonanPindahAnggota: Array<{
    permohonanPindahAnggotaId: string;
    nik: string;
    nama: string;
    shdk: string;
  }>;
};

interface PermohonanPindahDetailProps {
  permohonan: PermohonanPindahWithUser;
}

export function PermohonanPindahDetail({ permohonan }: PermohonanPindahDetailProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DIAJUKAN":
        return <Badge variant="secondary">Diajukan</Badge>;
      case "DIPROSES":
        return <Badge variant="default">Diproses</Badge>;
      case "DISETUJUI":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Disetujui</Badge>;
      case "DITOLAK":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJenisPermohonanLabel = (jenis: string) => {
    switch (jenis) {
      case "SKP":
        return "Surat Keterangan Pindah";
      case "SKPLN":
        return "Surat Keterangan Pindah Luar Negeri";
      case "SKTT":
        return "Surat Keterangan Tinggal Tetap";
      default:
        return jenis;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Detail Permohonan Pindah</CardTitle>
            <CardDescription>
              Informasi lengkap permohonan pindah {permohonan.nama}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`${PATHS.PINDAH_REQUEST_EDIT}/${permohonan.permohonanPindahId}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <PermohonanPindahFollowUpModal permohonan={permohonan} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informasi Umum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Nomor Permohonan</p>
              <p className="font-medium">{permohonan.nomorPermohonan || "Belum ada nomor"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {getStatusBadge(permohonan.statusPermohonan)}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Jenis Permohonan</p>
              <p className="font-medium">{getJenisPermohonanLabel(permohonan.jenisPermohonanPindah)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</p>
              <p className="font-medium">{format(permohonan.createdAt, "dd MMMM yyyy", { locale: id })}</p>
            </div>
          </div>

          {/* Data Pemohon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Pemohon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">NIK</p>
                <p className="font-mono">{permohonan.nik}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{permohonan.nama}</p>
              </div>
            </div>
          </div>

          {/* Data Alamat Asal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Alamat Asal</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Alamat Lengkap</p>
              <p>{permohonan.alamatAsal}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">RT</p>
                <p>{permohonan.rtAsal}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">RW</p>
                <p>{permohonan.rwAsal}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Desa</p>
                <p>{permohonan.desaAsal}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Kecamatan</p>
                <p>{permohonan.kecamatanAsal}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Kabupaten</p>
                <p>{permohonan.kabupatenAsal}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Provinsi</p>
                <p>{permohonan.provinsiAsal}</p>
              </div>
            </div>
          </div>

          {/* Data Alamat Tujuan (untuk SKP) */}
          {permohonan.jenisPermohonanPindah === "SKP" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Alamat Tujuan</h3>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Alamat Lengkap</p>
                <p>{permohonan.alamatTujuan}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">RT</p>
                  <p>{permohonan.rtTujuan}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">RW</p>
                  <p>{permohonan.rwTujuan}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Desa</p>
                  <p>{permohonan.desaTujuan}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Kecamatan</p>
                  <p>{permohonan.kecamatanTujuan}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Kabupaten</p>
                  <p>{permohonan.kabupatenTujuan}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Provinsi</p>
                  <p>{permohonan.provinsiTujuan}</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Anggota Keluarga */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Anggota Keluarga Yang Pindah</h3>
            <div className="space-y-3">
              {permohonan.permohonanPindahAnggota.map((anggota, index) => (
                <Card key={anggota.permohonanPindahAnggotaId} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">NIK</p>
                      <p className="font-mono">{anggota.nik}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                      <p className="font-medium">{anggota.nama}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Status Hubungan</p>
                      <p>{anggota.shdk}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Dokumen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dokumen Pendukung</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {permohonan.dokumenKK && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Dokumen KK</span>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={permohonan.dokumenKK} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              )}
              {permohonan.dokumenKTP && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Dokumen KTP</span>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={permohonan.dokumenKTP} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              )}
              {permohonan.dokumenSP && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Dokumen Surat Pengantar</span>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={permohonan.dokumenSP} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Catatan */}
          {permohonan.catatan && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Catatan</p>
              <p className="text-sm bg-muted p-3 rounded-md">{permohonan.catatan}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
