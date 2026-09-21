"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PATHS } from "@/constants/paths";
import { PermohonanPindah } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { PermohonanPindahColumnHeader } from "./permohonan-pindah-column-header";
import { PermohonanPindahDeleteModal } from "./permohonan-pindah-delete-modal";

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

export const permohonanPindahColumns: ColumnDef<PermohonanPindahWithUser>[] = [
  {
    accessorKey: "nomorPermohonan",
    header: ({ column }) => (
      <PermohonanPindahColumnHeader column={column} title="Nomor Permohonan" />
    ),
    cell: ({ row }) => {
      const nomorPermohonan = row.getValue("nomorPermohonan") as string;
      return (
        <div className="font-medium">
          {nomorPermohonan || "Belum ada nomor"}
        </div>
      );
    },
  },
  {
    accessorKey: "nama",
    header: ({ column }) => (
      <PermohonanPindahColumnHeader column={column} title="Nama Pemohon" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("nama")}</div>;
    },
  },
  {
    accessorKey: "nik",
    header: ({ column }) => (
      <PermohonanPindahColumnHeader column={column} title="NIK" />
    ),
    cell: ({ row }) => {
      return <div className="font-mono">{row.getValue("nik")}</div>;
    },
  },
  {
    accessorKey: "jenisPermohonanPindah",
    header: ({ column }) => (
      <PermohonanPindahColumnHeader column={column} title="Jenis Permohonan" />
    ),
    cell: ({ row }) => {
      const jenis = row.getValue("jenisPermohonanPindah") as string;
      return (
        <Badge variant="outline">
          {jenis === "SKP" ? "Surat Keterangan Pindah" : 
           jenis === "SKPLN" ? "Surat Keterangan Pindah Luar Negeri" :
           jenis === "SKTT" ? "Surat Keterangan Tinggal Tetap" : jenis}
        </Badge>
      );
    },
  },
  {
    accessorKey: "alamatAsal",
    header: "Alamat Asal",
    cell: ({ row }) => {
      const alamat = row.getValue("alamatAsal") as string;
      return <div className="max-w-[200px] truncate">{alamat}</div>;
    },
  },
  {
    accessorKey: "statusPermohonan",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusPermohonan") as string;
      
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

      return getStatusBadge(status);
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <PermohonanPindahColumnHeader column={column} title="Tanggal Dibuat" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm">
          {format(date, "dd MMMM yyyy", { locale: id })}
        </div>
      );
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
              <Link href={`${PATHS.PINDAH_REQUEST}/${permohonan.permohonanPindahId}`}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${PATHS.PINDAH_REQUEST_EDIT}/${permohonan.permohonanPindahId}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <PermohonanPindahDeleteModal permohonanId={permohonan.permohonanPindahId} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
