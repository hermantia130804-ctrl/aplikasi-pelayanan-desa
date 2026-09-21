"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { StatusPermohonan } from "@/generated/prisma";
import { PermohonanKTP } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import Link from "next/link";
import { PermohonanKTPColumnHeader } from "./permohonan-ktp-column-header";
import { EyeIcon, PencilIcon } from "lucide-react";
import { PermohonanKTPDeleteModal } from "./permohonan-ktp-delete-modal";

export const permohonanKTPColumns: ColumnDef<PermohonanKTP>[] = [
  {
    accessorKey: "nik",
    header: () => PermohonanKTPColumnHeader({ accessorKey: "nik", title: "NIK" }),
    cell: ({ row }) => {
      return <div>{row.original.nik}</div>;
    },
  },
  // Nomor Permohonan
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "nomorPermohonan", title: "No. Permohonan" }),
    accessorKey: "nomorPermohonan",
    cell: ({ row }) => {
      const nomor = row.original.nomorPermohonan;
      return <span>{nomor ? nomor : "belum terdaftar"}</span>;
    },
  },
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "nama", title: "Nama Pemohon" }),
    accessorKey: "nama",
  },
  // Alamat singkat
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "alamat", title: "Alamat" }),
    id: "alamatSingkat",
    cell: ({ row }) => {
      const { alamat, rt, rw, desa } = row.original;
      return `${alamat ? alamat.split(',')[0] : "-"} RT ${rt}/RW ${rw}, ${desa}`;
    },
  },
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "jenisPermohonanKTP", title: "Jenis Permohonan" }),
    accessorKey: "jenisPermohonanKTP",
    cell: ({ row }) => {
      const status = row.original.jenisPermohonanKTP
      return (
        <Badge variant={'default'}>
          {status}
        </Badge>
      );
    },
  },
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "statusPermohonan", title: "Status Permohonan" }),
    accessorKey: "statusPermohonan",
    cell: ({ row }) => {
      const status = row.original.statusPermohonan
      return (
        <Badge variant={'default'}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => PermohonanKTPColumnHeader({ accessorKey: "createdAt", title: "Tanggal Dibuat" }),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return moment(date).format("DD MMMM YYYY");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`${PATHS.KTP_REQUEST}/${row.original.permohonanKtpId}`}>
            <EyeIcon />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`${PATHS.KTP_REQUEST}/edit/${row.original.permohonanKtpId}`}>
            <PencilIcon />
          </Link>
        </Button>
        <PermohonanKTPDeleteModal permohonanKtpId={row.original.permohonanKtpId} />
      </div>
    ),
  },
];
