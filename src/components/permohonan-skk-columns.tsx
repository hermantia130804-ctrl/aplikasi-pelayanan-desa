"use client";

import { PermohonanSKKColumnHeader } from "@/components/permohonan-skk-column-header";
import { PermohonanSKKDeleteModal } from "@/components/permohonan-skk-delete-modal";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { PermohonanSKK } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { EyeIcon, PencilIcon } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { Badge } from "./ui/badge";

export const permohonanSKKColumns: ColumnDef<PermohonanSKK>[] = [
  {
    accessorKey: "nomorPermohonan",
    header: ({ column }) => (
      <PermohonanSKKColumnHeader column={column} title="Nomor Permohonan" />
    ),
    cell: ({ row }) => {
      const nomorPermohonan = row.getValue("nomorPermohonan") as string;
      return (
        <div className="font-medium">
          {nomorPermohonan || "Belum terdaftar"}
        </div>
      );
    },
  },
  {
    accessorKey: "nama",
    header: ({ column }) => (
      <PermohonanSKKColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => {
      const nama = row.getValue("nama") as string;
      return <div className="font-medium">{nama}</div>;
    },
  },
  {
    accessorKey: "nik",
    header: ({ column }) => (
      <PermohonanSKKColumnHeader column={column} title="NIK" />
    ),
    cell: ({ row }) => {
      const nik = row.getValue("nik") as string;
      return <div className="font-mono text-sm">{nik}</div>;
    },
  },
  {
    accessorKey: "umur",
    header: ({ column }) => (
      <PermohonanSKKColumnHeader column={column} title="Umur" />
    ),
    cell: ({ row }) => {
      const umur = row.getValue("umur") as number;
      return <div className="text-center">{umur} tahun</div>;
    },
  },
  {
    accessorKey: "statusPermohonan",
    header: "Status",
    cell: ({ row }) => {
      const permohonanSKK = row.original;
      return (
       <Badge variant={permohonanSKK.statusPermohonan === "DISETUJUI" ? "default" : "destructive"}>
         {permohonanSKK.statusPermohonan}
       </Badge>
      );
    },
  },
  {
    accessorKey: "tanggalMeninggal",
    header: ({ column }) => (
      <PermohonanSKKColumnHeader column={column} title="Tanggal Meninggal" />
    ),
    cell: ({ row }) => {
      const tanggalMeninggal = row.getValue("tanggalMeninggal") as Date;
      return (
        <div className="text-sm">
          {tanggalMeninggal ? moment(tanggalMeninggal).format("DD/MM/YYYY") : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <PermohonanSKKColumnHeader column={column} title="Tanggal Dibuat" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-muted-foreground">
          {moment(createdAt).format("DD/MM/YYYY HH:mm")}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => PermohonanSKKColumnHeader({ accessorKey: "actions", title: "Aksi" }),
    header: "Aksi",
    cell: ({ row }) => {
      const permohonanSKK = row.original;

      return (
        <>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${PATHS.SKK_REQUEST}/${permohonanSKK.permohonanSKKId}`}>
                <EyeIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${PATHS.SKK_REQUEST_EDIT}/${permohonanSKK.permohonanSKKId}`}>
                <PencilIcon className="h-4 w-4" />
              </Link>
            </Button>
            <PermohonanSKKDeleteModal
              permohonanSKK={permohonanSKK}
            />
          </div>
        </>
      );
    },
  },
];
