"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusPermohonan } from "@/generated/prisma";
import { updatePermohonanKTPStatusAction } from "@/lib/server/actions/permohonan-ktp";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanKTPUpdateStatusProps = {
  id: string;
  status: StatusPermohonan;
};

export const PermohonanKTPUpdateStatus = ({
  id,
  status,
}: PermohonanKTPUpdateStatusProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<StatusPermohonan>(status);

  const handleUpdateStatus = async (newStatus: StatusPermohonan) => {
    if (newStatus === currentStatus) return;

    try {
      setLoading(true);
      const response = await updatePermohonanKTPStatusAction(id, newStatus);
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

  const statusConfig: Record<
    StatusPermohonan,
    { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
  > = {
    DIAJUKAN: { label: "Menunggu", variant: "secondary" },
    DISETUJUI: { label: "Disetujui", variant: "default" },
    DITOLAK: { label: "Ditolak", variant: "destructive" },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={loading}>
        <Button variant="ghost" className="h-8 px-2 py-1">
          <Badge
            variant={statusConfig[currentStatus].variant}
            className="cursor-pointer"
          >
            {statusConfig[currentStatus].label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleUpdateStatus("DIAJUKAN")}
          disabled={currentStatus === "DIAJUKAN" || loading}
        >
          Menunggu
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleUpdateStatus("DISETUJUI")}
          disabled={currentStatus === "DISETUJUI" || loading}
        >
          Disetujui
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleUpdateStatus("DITOLAK")}
          disabled={currentStatus === "DITOLAK" || loading}
        >
          Ditolak
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
