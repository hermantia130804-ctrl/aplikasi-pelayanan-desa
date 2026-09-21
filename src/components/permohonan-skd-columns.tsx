"use client";

import { PermohonanSKD } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PATHS } from "@/constants/paths";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PermohonanSKDColumnHeader } from "./permohonan-skd-column-header";
import { PermohonanSKDDeleteModal } from "./permohonan-skd-delete-modal";

type PermohonanSKDWithUser = PermohonanSKD & {
  user: {
    userId: string;
    name: string;
    email: string;
  };
};

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

export const permohonanSKDColumns: ColumnDef<PermohonanSKDWithUser>[] = [
  {
    accessorKey: "nama",
    header: ({ column }) => (
      <PermohonanSKDColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => {
      const nama = row.getValue("nama") as string;
      return <div className="font-medium">{nama}</div>;
    },
  },
  {
    accessorKey: "nik",
    header: ({ column }) => (
      <PermohonanSKDColumnHeader column={column} title="NIK" />
    ),
    cell: ({ row }) => {
      const nik = row.getValue("nik") as string;
      return <div className="font-mono text-sm">{nik}</div>;
    },
  },
  {
    accessorKey: "alamatKTP",
    header: "Alamat KTP",
    cell: ({ row }) => {
      const alamat = row.getValue("alamatKTP") as string;
      return <div className="max-w-[200px] truncate">{alamat}</div>;
    },
  },
  {
    accessorKey: "alamatDomisili",
    header: "Alamat Domisili",
    cell: ({ row }) => {
      const alamat = row.getValue("alamatDomisili") as string;
      return <div className="max-w-[200px] truncate">{alamat}</div>;
    },
  },
  {
    accessorKey: "wargaNegara",
    header: "Warga Negara",
    cell: ({ row }) => {
      const wargaNegara = row.getValue("wargaNegara") as string;
      return <Badge variant="outline">{wargaNegara}</Badge>;
    },
  },
  {
    accessorKey: "statusPermohonan",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusPermohonan") as string;
      return getStatusBadge(status);
    },
  },
  {
    accessorKey: "nomorPermohonan",
    header: "Nomor Permohonan",
    cell: ({ row }) => {
      const nomor = row.getValue("nomorPermohonan") as string | null;
      return nomor ? (
        <div className="font-mono text-sm">{nomor}</div>
      ) : (
        <div className="text-muted-foreground text-sm">-</div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <PermohonanSKDColumnHeader column={column} title="Tanggal Dibuat" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return <div className="text-sm">{format(date, "dd MMM yyyy", { locale: id })}</div>;
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const permohonan = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`${PATHS.SKD_REQUEST}/${permohonan.permohonanSKDId}`}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${PATHS.SKD_REQUEST}/edit/${permohonan.permohonanSKDId}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <PermohonanSKDDeleteModal permohonan={permohonan}>
                <span className="flex items-center text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </span>
              </PermohonanSKDDeleteModal>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
