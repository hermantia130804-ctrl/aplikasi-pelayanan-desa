"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermohonanKK } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import Link from "next/link";
import { EyeIcon, PencilIcon } from "lucide-react";
import { PermohonanKTPColumnHeader } from "./permohonan-ktp-column-header";
import { PermohonanKKDeleteButton } from "./permohonan-kk-delete-button";

export const permohonanKKColumns: ColumnDef<PermohonanKK>[] = [
  {
    accessorKey: "nik",
    header: () => PermohonanKTPColumnHeader({ accessorKey: "nik", title: "NIK" }),
    cell: ({ row }) => {
      return <div>{row.original.nik}</div>;
    },
  },
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
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "alamat", title: "Alamat" }),
    id: "alamatSingkat",
    cell: ({ row }) => {
      const { alamat, rt, rw, desa } = row.original;
      return `${alamat ? alamat.split(',')[0] : "-"} RT ${rt}/RW ${rw}, ${desa}`;
    },
  },
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "alasanPermohonan", title: "Alasan Permohonan" }),
    accessorKey: "alasanPermohonan",
    cell: ({ row }) => {
      return (
        <Badge variant={'default'}>
          {row.original.alasanPermohonan}
        </Badge>
      );
    },
  },
  {
    header: () => PermohonanKTPColumnHeader({ accessorKey: "statusPermohonan", title: "Status Permohonan" }),
    accessorKey: "statusPermohonan",
    cell: ({ row }) => {
      const status = row.original.statusPermohonan;
      const variant = status === "DISETUJUI" ? "default" : status === "DITOLAK" ? "destructive" : "secondary";
      return (
        <Badge variant={variant}>
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
  header: () => PermohonanKTPColumnHeader({ accessorKey: "actions", title: "Aksi" }),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/permohonan-kk/${row.original.permohonanKKId}`}>
            <EyeIcon />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/permohonan-kk/edit/${row.original.permohonanKKId}`}>
            <PencilIcon />
          </Link>
        </Button>
        <PermohonanKKDeleteButton permohonanKKId={row.original.permohonanKKId} />
      </div>
    ),
  },
];
