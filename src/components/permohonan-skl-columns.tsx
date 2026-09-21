"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { PermohonanSKL } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { EyeIcon, PencilIcon } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { PermohonanSKLColumnHeader } from "./permohonan-skl-column-header";
import { PermohonanSKLDeleteModal } from "./permohonan-skl-delete-modal";

export const permohonanSKLColumns: ColumnDef<PermohonanSKL>[] = [
  // Nomor Permohonan
  {
    header: () => PermohonanSKLColumnHeader({ accessorKey: "nomorPermohonan", title: "No. Permohonan" }),
    accessorKey: "nomorPermohonan",
    cell: ({ row }) => {
      const nomor = row.original.nomorPermohonan;
      return <span>{nomor ? nomor : "belum terdaftar"}</span>;
    },
  },
  {
    header: () => PermohonanSKLColumnHeader({ accessorKey: "nama", title: "Nama Anak" }),
    accessorKey: "nama",
  },
  // Tempat, Tanggal Lahir
  {
    header: () => PermohonanSKLColumnHeader({ accessorKey: "tempatLahir", title: "Tempat, Tanggal Lahir" }),
    id: "tempatTanggalLahir",
    cell: ({ row }) => {
      const { tempatLahir, tanggalLahir } = row.original;
      return `${tempatLahir}, ${moment(tanggalLahir).format("DD/MM/YYYY")}`;
    },
  },
  // Nama Ayah
  {
    header: () => PermohonanSKLColumnHeader({ accessorKey: "namaAyah", title: "Nama Ayah" }),
    accessorKey: "namaAyah",
  },
  // Nama Ibu
  {
    header: () => PermohonanSKLColumnHeader({ accessorKey: "namaIbu", title: "Nama Ibu" }),
    accessorKey: "namaIbu",
  },
  // Alamat singkat
  {
    header: () => PermohonanSKLColumnHeader({ accessorKey: "alamat", title: "Alamat" }),
    id: "alamatSingkat",
    cell: ({ row }) => {
      const { alamat } = row.original;
      return alamat ? alamat.substring(0, 50) + (alamat.length > 50 ? "..." : "") : "-";
    },
  },
  {
    header: () => PermohonanSKLColumnHeader({ accessorKey: "statusPermohonan", title: "Status" }),
    accessorKey: "statusPermohonan",
    cell: ({ row }) => {
      const status = row.original.statusPermohonan;
      return (
        <Badge variant={status === "DISETUJUI" ? "default" : status === "DITOLAK" ? "destructive" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => PermohonanSKLColumnHeader({ accessorKey: "createdAt", title: "Tanggal Dibuat" }),
    cell: ({ row }) => {
      return moment(row.original.createdAt).format("DD/MM/YYYY HH:mm");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${PATHS.SKL_REQUEST}/${row.original.permohonanSKLId}`}>
            <EyeIcon className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${PATHS.SKL_REQUEST}/edit/${row.original.permohonanSKLId}`}>
            <PencilIcon className="h-4 w-4" />
          </Link>
        </Button>
        <PermohonanSKLDeleteModal permohonanSKL={row.original} />
      </div>
    ),
  },
];
