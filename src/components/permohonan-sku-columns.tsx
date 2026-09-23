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
import { PermohonanSKU } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { PermohonanSKUColumnHeader } from "./permohonan-sku-column-header";
import { PermohonanSKUDeleteModal } from "./permohonan-sku-delete-modal";

type PermohonanSKUWithUser = PermohonanSKU & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
};

export const permohonanSKUColumns: ColumnDef<PermohonanSKUWithUser>[] = [
  {
    accessorKey: "nomorPermohonan",
    header: ({ column }) => (
      <PermohonanSKUColumnHeader column={column} title="Nomor Permohonan" />
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
      <PermohonanSKUColumnHeader column={column} title="Nama Pemohon" />
    ),
    cell: ({ row }) => {
      const nama = row.getValue("nama") as string;
      return <div className="font-medium">{nama}</div>;
    },
  },
  {
    accessorKey: "nik",
    header: ({ column }) => (
      <PermohonanSKUColumnHeader column={column} title="NIK" />
    ),
    cell: ({ row }) => {
      const nik = row.getValue("nik") as string;
      return <div className="font-mono text-sm">{nik}</div>;
    },
  },
  {
    accessorKey: "jenisUsaha",
    header: ({ column }) => (
      <PermohonanSKUColumnHeader column={column} title="Jenis Usaha" />
    ),
    cell: ({ row }) => {
      const jenisUsaha = row.getValue("jenisUsaha") as string;
      return <div className="max-w-[200px] truncate">{jenisUsaha}</div>;
    },
  },
  {
    accessorKey: "tahunBerdiriUsaha",
    header: ({ column }) => (
      <PermohonanSKUColumnHeader column={column} title="Tahun Berdiri" />
    ),
    cell: ({ row }) => {
      const tahun = row.getValue("tahunBerdiriUsaha") as number;
      return <div className="text-center">{tahun}</div>;
    },
  },
  {
    accessorKey: "statusPermohonan",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusPermohonan") as string;
      const getStatusColor = (status: string) => {
        switch (status) {
          case "DIAJUKAN":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
          case "DIPROSES":
            return "bg-blue-100 text-blue-800 border-blue-200";
          case "DISETUJUI":
            return "bg-green-100 text-green-800 border-green-200";
          case "DITOLAK":
            return "bg-red-100 text-red-800 border-red-200";
          default:
            return "bg-gray-100 text-gray-800 border-gray-200";
        }
      };

      return (
        <Badge variant="outline" className={getStatusColor(status)}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <PermohonanSKUColumnHeader column={column} title="Tanggal Dibuat" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm">
          {format(createdAt, "dd MMM yyyy", { locale: id })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => PermohonanSKUColumnHeader({ accessorKey: "actions", title: "Aksi" }),
    header: "Aksi",
    cell: ({ row }) => {
      const permohonan = row.original;

      return (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`${PATHS.SKU_REQUEST}/${permohonan.permohonanSKUId}`}
                  className="flex items-center"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`${PATHS.SKU_REQUEST_EDIT}/${permohonan.permohonanSKUId}`}
                  className="flex items-center"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <PermohonanSKUDeleteModal permohonan={permohonan} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
