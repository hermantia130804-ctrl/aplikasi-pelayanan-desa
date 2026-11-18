"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/constants/paths";
import { User } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { EyeIcon, PencilIcon } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { UserColumnHeader } from "./user-column-header";
import { UserDeleteModal } from "./user-delete-modal";
import { UserUpdateRole } from "./user-update-role";
import { UserUpdateStatus } from "./user-update-status";

// Helper: ambil inisial nama sebagai fallback avatar (contoh: "Herman Gozali" -> "HG")
const parseNameFallback = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const userColumns: ColumnDef<Omit<User, "password">>[] = [
  // Kolom Foto Profil — tampil paling kiri di tabel "Kelola Data Pengguna".
  // Pakai Avatar shadcn (object-cover) supaya foto tampil full & jelas.
  // Jika user.foto kosong/gagal load, tampilkan inisial nama sebagai fallback.
  {
    id: "foto",
    accessorKey: "foto",
    header: () => <div className="text-center">Foto</div>,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex justify-center">
          <Avatar className="h-11 w-11 rounded-full overflow-hidden ring-1 ring-border/50">
            <AvatarImage
              src={user.foto ?? ""}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {parseNameFallback(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: "nik",
    header: () => UserColumnHeader({ accessorKey: "nik", title: "NIK" }),
    cell: ({ row }) => {
      return <div>{row.original.nik}</div>;
    },
  },
  {
    accessorKey: "name",
    header: () => UserColumnHeader({ accessorKey: "name", title: "Nama" }),
    cell: ({ row }) => {
      return <div>{row.original.name}</div>;
    },
  },
  {
    accessorKey: "email",
    header: () => UserColumnHeader({ accessorKey: "email", title: "Email" }),
    cell: ({ row }) => {
      return <div>{row.original.email}</div>;
    },
  },
  {
    accessorKey: "role",
    header: () => UserColumnHeader({ accessorKey: "role", title: "Peran" }),
    cell: ({ row }) => (
      <UserUpdateRole key={row.original.userId} role={row.original.role} userId={row.original.userId} />
    ),
  },
  {
    accessorKey: "status",
    header: () => UserColumnHeader({ accessorKey: "status", title: "Status" }),
    cell: ({ row }) => (
      <UserUpdateStatus key={row.original.userId} userId={row.original.userId} status={row.original.status} />
    ),
  },
  {
    accessorKey: "verifiedAt",
    header: () => UserColumnHeader({ accessorKey: "verifiedAt", title: "Verifikasi Pada" }),
    cell: ({ row }) => {
      const date = row.original.verifiedAt;
      return date ? moment(date).format("DD-MM-YYYY HH:mm:ss") : "Belum Diverifikasi";
    },
  },
  {
    accessorKey: "createdAt",
    header: () => UserColumnHeader({ accessorKey: "createdAt", title: "Dibuat Pada" }),
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return date ? moment(date).format("DD-MM-YYYY HH:mm:ss") : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`${PATHS.USER}/${row.original.userId}`}>
            <EyeIcon />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`${PATHS.USER_UPDATE}/${row.original.userId}`}>
            <PencilIcon />
          </Link>
        </Button>
        <UserDeleteModal userId={row.original.userId} />
      </div>
    ),
  },
];