"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { PermohonanSKTM } from "@/generated/prisma";
import { ArrowLeftIcon, EditIcon, ExternalLinkIcon, FileCheck2 } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PermohonanSKTMUpdateStatusModal } from "./permohonan-sktm-update-status-modal";

export type PermohonanSKTMDetailProps = {
  permohonanSKTM: PermohonanSKTM;
};

const statusColor: Record<string, string> = {
  DIAJUKAN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DISETUJUI: "bg-green-100 text-green-800 border-green-200",
  DITOLAK: "bg-red-100 text-red-800 border-red-200",
};

export function PermohonanSKTMDetail({ permohonanSKTM }: PermohonanSKTMDetailProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const {
    nomorPermohonan,
    statusPermohonan,
    nama,
    nik,
    tempatLahir,
    tanggalLahir,
    jenisKelamin,
    agama,
    alamat,
    keterangan,
    catatan,
    dokumenKK,
    dokumenKTP,
    dokumenPengantar,
    createdAt,
    updatedAt,
  } = permohonanSKTM;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`${PATHS.SKTM_REQUEST_EDIT}/${permohonanSKTM.permohonanSKTMId}`}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <FileCheck2 className="h-4 w-4 mr-2" />
            Tindak Lanjut
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge>No. {nomorPermohonan ?? "belum terdaftar"}</Badge>
        <Badge className={statusColor[statusPermohonan] || "bg-gray-100 text-gray-800"}>
          {statusPermohonan}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Dibuat: {moment(createdAt).format("DD/MM/YYYY HH:mm")}
        </span>
        {updatedAt && (
          <span className="text-sm text-muted-foreground">
            • Diperbarui: {moment(updatedAt).format("DD/MM/YYYY HH:mm")}
          </span>
        )}
      </div>

      {/* Data Pemohon */}
      <Card>
        <CardHeader>
          <CardTitle>Data Pemohon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIK</label>
              <p className="text-sm">{nik}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="text-sm">{nama}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Jenis Kelamin</label>
              <p className="text-sm">{jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Agama</label>
              <p className="text-sm">{agama}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tempat Lahir</label>
              <p className="text-sm">{tempatLahir}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tanggal Lahir</label>
              <p className="text-sm">{moment(tanggalLahir).format("DD/MM/YYYY")}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Alamat</label>
            <p className="text-sm">{alamat}</p>
          </div>
        </CardContent>
      </Card>

      {/* Keterangan */}
      <Card>
        <CardHeader>
          <CardTitle>Keterangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Keterangan</label>
            <p className="text-sm whitespace-pre-wrap">{keterangan}</p>
          </div>
          {catatan && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Catatan</label>
              <p className="text-sm whitespace-pre-wrap">{catatan}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dokumen Pendukung */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Pendukung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dokumen KK</label>
              {dokumenKK ? (
                <div className="mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={dokumenKK} target="_blank">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Lihat Dokumen
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Tidak ada dokumen</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dokumen KTP</label>
              {dokumenKTP ? (
                <div className="mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={dokumenKTP} target="_blank">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Lihat Dokumen
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Tidak ada dokumen</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dokumen Pengantar</label>
              {dokumenPengantar ? (
                <div className="mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={dokumenPengantar} target="_blank">
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Lihat Dokumen
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Tidak ada dokumen</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Modal */}
      <PermohonanSKTMUpdateStatusModal
        permohonanSKTM={permohonanSKTM}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
