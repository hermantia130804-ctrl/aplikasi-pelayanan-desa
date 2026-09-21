"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PermohonanKTP } from "@/generated/prisma";
import { ArrowLeftIcon, FileCheck2 } from "lucide-react";
import moment from "moment";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { PermohonanKTPFollowUpModal } from "./permohonan-ktp-follow-up-modal";

export type PermohonanKTPDetailProps = {
  permohonanKTP: PermohonanKTP;
};

const statusColor: Record<string, string> = {
  DIAJUKAN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DIPROSES: "bg-blue-100 text-blue-800 border-blue-200",
  SELESAI: "bg-green-100 text-green-800 border-green-200",
  DITOLAK: "bg-red-100 text-red-800 border-red-200",
};

const PermohonanKTPPDFDownloadButton = dynamic(
  () => import("./permohonan-ktp-pdf-download-button").then(mod => mod.PermohonanKTPPDFDownloadButton),
  { ssr: false }
);

export function PermohonanKTPDetail({ permohonanKTP }: PermohonanKTPDetailProps) {
  const router = useRouter();
  const {
    nomorPermohonan,
    statusPermohonan,
    jenisPermohonanKTP,
    nama,
    nik,
    tempatLahir,
    tanggalLahir,
    jenisKelamin,
    golonganDarah,
    statusPerkawinan,
    agama,
    alamat,
    provinsi,
    kabupaten,
    kecamatan,
    desa,
    rt,
    rw,
    kodePos,
    dokumenKK,
    dokumenPengantar,
    catatan,
    createdAt,
    updatedAt,
    permohonanKtpId,
  } = permohonanKTP;

  return (
    <div>
      <Button variant="outline" className="mb-4 w-auto" onClick={() => router.back()}>
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Kembali
      </Button>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Detail Permohonan KTP</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {nomorPermohonan && (
                <Badge variant="secondary">No: {nomorPermohonan}</Badge>
              )}
              {statusPermohonan && (
                <Badge className={statusColor[statusPermohonan] || "bg-gray-100 text-gray-800 border-gray-200"}>
                  {statusPermohonan.charAt(0) + statusPermohonan.slice(1).toLowerCase()}
                </Badge>
              )}
              {jenisPermohonanKTP && (
                <Badge>{jenisPermohonanKTP}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <PermohonanKTPPDFDownloadButton
              data={permohonanKTP}
              fileName={`ktp-${(nama || '').toLowerCase().replace(/\s+/g, '-')}-${(nik || '').toLowerCase()}.pdf`}
            />
            <PermohonanKTPFollowUpModal
              permohonanKtpId={permohonanKtpId || ''}
              statusPermohonan={statusPermohonan || 'DIAJUKAN'}
              catatan={catatan || ''}
              nomorPermohonan={nomorPermohonan || ''}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Diri */}
          <section>
            <h2 className="font-semibold mb-2">I. Data Diri</h2>
            <Separator className="mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Nama" value={nama} />
              <DetailRow label="NIK" value={nik} />
              <DetailRow label="Tempat, Tanggal Lahir" value={`${tempatLahir || "-"}, ${tanggalLahir ? moment(tanggalLahir).format("DD MMMM YYYY") : "-"}`} />
              <DetailRow label="Jenis Kelamin" value={jenisKelamin} />
              <DetailRow label="Golongan Darah" value={golonganDarah} />
              <DetailRow label="Status Perkawinan" value={statusPerkawinan} />
              <DetailRow label="Agama" value={agama} />
            </div>
          </section>
          {/* Alamat */}
          <section>
            <h2 className="font-semibold mb-2">II. Alamat</h2>
            <Separator className="mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Alamat" value={alamat} className="sm:col-span-2" />
              <DetailRow label="Provinsi" value={provinsi} />
              <DetailRow label="Kabupaten" value={kabupaten} />
              <DetailRow label="Kecamatan" value={kecamatan} />
              <DetailRow label="Desa" value={desa} />
              <DetailRow label="RT/RW" value={`${rt || "-"}/${rw || "-"}`} />
              <DetailRow label="Kode Pos" value={kodePos} />
            </div>
          </section>
          {/* Jenis Permohonan */}
          <section>
            <h2 className="font-semibold mb-2">III. Jenis Permohonan</h2>
            <Separator className="mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Jenis Permohonan" value={jenisPermohonanKTP} />
            </div>
          </section>
          {/* Dokumen */}
          <section>
            <h2 className="font-semibold mb-2">IV. Dokumen</h2>
            <Separator className="mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailFile label="Dokumen KK" url={dokumenKK || ""} />
              <DetailFile label="Dokumen Pengantar" url={dokumenPengantar || ""} />
            </div>
          </section>
          {/* Catatan */}
          <section>
            <h2 className="font-semibold mb-2">Catatan</h2>
            <Separator className="mb-2" />
            <div className="text-sm  min-h-[24px]">{catatan || '-'}</div>
          </section>
          {/* Metadata */}
          <section>
            <h2 className="font-semibold mb-2">Metadata</h2>
            <Separator className="mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
              <DetailRow label="Dibuat" value={createdAt ? moment(createdAt).format("DD MMMM YYYY, HH:mm") : '-'} />
              <DetailRow label="Diupdate" value={updatedAt ? moment(updatedAt).format("DD MMMM YYYY, HH:mm") : '-'} />
            </div>
          </section>
        </CardContent>
      </Card>

    </div>
  );
}

function DetailRow({ label, value, className = "" }: { label: string; value?: string; className?: string }) {
  return (
    <div className={"flex flex-col gap-0.5 " + className}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-medium text-sm break-words">{value || '-'}</span>
    </div>
  );
}

function DetailFile({ label, url }: { label: string; url?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
        >
          <FileCheck2 className="w-4 h-4" />
          Lihat Dokumen
        </a>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
      )}
    </div>
  );
} 