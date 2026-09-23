"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { StatusPermohonan } from "@/generated/prisma";
import { PermohonanSKTM } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import Link from "next/link";
import { PermohonanSKTMColumnHeader } from "./permohonan-sktm-column-header";
import { EyeIcon, PencilIcon } from "lucide-react";
import { PermohonanSKTMDeleteModal } from "./permohonan-sktm-delete-modal";

export const permohonanSKTMColumns: ColumnDef<PermohonanSKTM>[] = [
  {
    accessorKey: "nik",
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "nik", title: "NIK" }),
    cell: ({ row }) => {
      return <div>{row.original.nik}</div>;
    },
  },
  // Nomor Permohonan
  {
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "nomorPermohonan", title: "No. Permohonan" }),
    accessorKey: "nomorPermohonan",
    cell: ({ row }) => {
      const nomor = row.original.nomorPermohonan;
      return <span>{nomor ? nomor : "belum terdaftar"}</span>;
    },
  },
  {
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "nama", title: "Nama Pemohon" }),
    accessorKey: "nama",
  },
  // Alamat singkat
  {
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "alamat", title: "Alamat" }),
    id: "alamatSingkat",
    cell: ({ row }) => {
      const alamat = row.original.alamat;
      return <span>{alamat.length > 30 ? `${alamat.substring(0, 30)}...` : alamat}</span>;
    },
  },
  // Keterangan singkat
  {
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "keterangan", title: "Keterangan" }),
    id: "keteranganSingkat",
    cell: ({ row }) => {
      const keterangan = row.original.keterangan;
      return <span>{keterangan.length > 40 ? `${keterangan.substring(0, 40)}...` : keterangan}</span>;
    },
  },
  // Status
  {
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "statusPermohonan", title: "Status" }),
    accessorKey: "statusPermohonan",
    cell: ({ row }) => {
      const status = row.original.statusPermohonan;
      return (
        <Badge
          variant={
            status === StatusPermohonan.DISETUJUI
              ? "default"
              : status === StatusPermohonan.DITOLAK
              ? "destructive"
              : "secondary"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  // Tanggal Dibuat
  {
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "createdAt", title: "Tanggal Dibuat" }),
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return <span>{moment(date).format("DD/MM/YYYY")}</span>;
    },
  },
  // Actions
  {
    id: "actions",
    header: () => PermohonanSKTMColumnHeader({ accessorKey: "actions", title: "Aksi" }),
    header: "Aksi",
    cell: ({ row }) => {
      const permohonanSKTM = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${PATHS.SKTM_REQUEST}/${permohonanSKTM.permohonanSKTMId}`}>
              <EyeIcon className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${PATHS.SKTM_REQUEST_EDIT}/${permohonanSKTM.permohonanSKTMId}`}>
              <PencilIcon className="h-4 w-4" />
            </Link>
          </Button>
          <PermohonanSKTMDeleteModal permohonanSKTM={permohonanSKTM} />
        </div>
      );
    },
  },
];
