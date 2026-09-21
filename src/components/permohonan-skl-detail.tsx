"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/constants/paths";
import { PermohonanSKL } from "@/generated/prisma";
import { ArrowLeftIcon, FileCheck2, PencilIcon } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PermohonanSKLUpdateStatusModal } from "./permohonan-skl-update-status-modal";

export type PermohonanSKLDetailProps = {
  permohonanSKL: PermohonanSKL;
};

const statusColor: Record<string, string> = {
  DIAJUKAN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DISETUJUI: "bg-green-100 text-green-800 border-green-200",
  DITOLAK: "bg-red-100 text-red-800 border-red-200",
};

export function PermohonanSKLDetail({ permohonanSKL }: PermohonanSKLDetailProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const {
    nomorPermohonan,
    statusPermohonan,
    nama,
    tempatLahir,
    tanggalLahir,
    jenisKelamin,
    alamat,
    namaAyah,
    nikAyah,
    pekerjaanAyah,
    tempatLahirAyah,
    tanggalLahirAyah,
    agamaAyah,
    namaIbu,
    nikIbu,
    pekerjaanIbu,
    tempatLahirIbu,
    tanggalLahirIbu,
    agamaIbu,
    dokumenKK,
    dokumenPengantar,
    dokumenSuratLahir,
    catatan,
    createdAt,
    updatedAt,
  } = permohonanSKL;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          {/* <div>
            <h1 className="text-2xl font-bold">Detail Permohonan SKL</h1>
            <p className="text-muted-foreground">
              Informasi lengkap permohonan Surat Keterangan Lahir
            </p>
          </div> */}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`${PATHS.SKL_REQUEST}/edit/${permohonanSKL.permohonanSKLId}`}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <FileCheck2 className="h-4 w-4 mr-2" />
            Tindak Lanjut
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
            <DetailRow label="Nomor Permohonan" value={nomorPermohonan || "Belum terdaftar"} />
            <DetailRow 
              label="Status" 
              value={
                <Badge className={statusColor[statusPermohonan] || "bg-gray-100 text-gray-800"}>
                  {statusPermohonan}
                </Badge>
              } 
            />
            <DetailRow label="Tanggal Dibuat" value={moment(createdAt).format("DD MMMM YYYY HH:mm")} />
            <DetailRow label="Terakhir Diperbarui" value={moment(updatedAt).format("DD MMMM YYYY HH:mm")} />
            {catatan && <DetailRow label="Catatan" value={catatan} />}
          </CardContent>
        </Card>

        {/* Data Anak */}
        <Card>
          <CardHeader>
            <CardTitle>Data Anak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Nama Lengkap" value={nama} />
            <DetailRow label="Jenis Kelamin" value={jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} />
            <DetailRow label="Tempat Lahir" value={tempatLahir} />
            <DetailRow label="Tanggal Lahir" value={moment(tanggalLahir).format("DD MMMM YYYY")} />
            <DetailRow label="Alamat" value={alamat} />
          </CardContent>
        </Card>

        {/* Data Ayah */}
        <Card>
          <CardHeader>
            <CardTitle>Data Ayah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Nama Ayah" value={namaAyah} />
            <DetailRow label="NIK Ayah" value={nikAyah} />
            <DetailRow label="Pekerjaan" value={pekerjaanAyah} />
            <DetailRow label="Tempat Lahir" value={tempatLahirAyah} />
            <DetailRow label="Tanggal Lahir" value={moment(tanggalLahirAyah).format("DD MMMM YYYY")} />
            <DetailRow label="Agama" value={agamaAyah} />
          </CardContent>
        </Card>

        {/* Data Ibu */}
        <Card>
          <CardHeader>
            <CardTitle>Data Ibu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Nama Ibu" value={namaIbu} />
            <DetailRow label="NIK Ibu" value={nikIbu} />
            <DetailRow label="Pekerjaan" value={pekerjaanIbu} />
            <DetailRow label="Tempat Lahir" value={tempatLahirIbu} />
            <DetailRow label="Tanggal Lahir" value={moment(tanggalLahirIbu).format("DD MMMM YYYY")} />
            <DetailRow label="Agama" value={agamaIbu} />
          </CardContent>
        </Card>

        {/* Dokumen Pendukung */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dokumen Pendukung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <DetailFile label="Dokumen KK" url={dokumenKK || ""} />
              <DetailFile label="Dokumen Pengantar" url={dokumenPengantar || ""} />
              <DetailFile label="Dokumen Surat Lahir" url={dokumenSuratLahir || ""} />
            </div>
          </CardContent>
        </Card>
      </div>

      <PermohonanSKLUpdateStatusModal
        permohonanSKL={permohonanSKL}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

function DetailRow({ label, value, className = "" }: { label: string; value?: string | React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "-"}</dd>
    </div>
  );
}

function DetailFile({ label, url }: { label: string; url?: string }) {
  return (
    <div className="flex flex-col space-y-2">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
          >
            <FileCheck2 className="h-4 w-4" />
            Lihat Dokumen
          </a>
        ) : (
          <span className="text-muted-foreground">Tidak ada dokumen</span>
        )}
      </dd>
    </div>
  );
}
