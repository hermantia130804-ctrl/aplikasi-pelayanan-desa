"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateStatusPermohonanKKAction } from "@/lib/server/actions/permohonan-kk";
import { useState } from "react";
import { toast } from "sonner";

type KKUpdateStatusProps = {
  id: string;
  status: "DIAJUKAN" | "DISETUJUI" | "DITOLAK";
};

export const KKUpdateStatus = ({ id, status }: KKUpdateStatusProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const statusConfig: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
    DIAJUKAN: { label: "Menunggu Proses", variant: "secondary" },
    DISETUJUI: { label: "Disetujui", variant: "default" },
    DITOLAK: { label: "Ditolak", variant: "destructive" },
  };

  const handleUpdate = async (newStatus: "DIAJUKAN" | "DISETUJUI" | "DITOLAK") => {
    if (newStatus === currentStatus) return;
    let catatan: string | undefined;
    if (newStatus === "DITOLAK") {
      catatan = window.prompt("Tuliskan alasan penolakan (akan tampil di Permohonan Saya warga):") ?? undefined;
    }
    try {
      setLoading(true);
      const response = await updateStatusPermohonanKKAction(id, newStatus, catatan);
      if (response.status === 200) {
        toast.success(response.message);
        setCurrentStatus(newStatus);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat mengubah status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={loading}>
        <Button variant="ghost" className="h-8 px-2 py-1">
          <Badge variant={statusConfig[currentStatus].variant} className="cursor-pointer">
            {statusConfig[currentStatus].label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleUpdate("DIAJUKAN")} disabled={currentStatus === "DIAJUKAN" || loading}>
          Menunggu Proses
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdate("DISETUJUI")} disabled={currentStatus === "DISETUJUI" || loading}>
          Disetujui
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdate("DITOLAK")} disabled={currentStatus === "DITOLAK" || loading}>
          Ditolak
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
