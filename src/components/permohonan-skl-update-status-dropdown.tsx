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
import { updatePermohonanSKLStatusAction } from "@/lib/server/actions/permohonan-skl";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanSKLUpdateStatusProps = {
  id: string;
  status: StatusPermohonan;
};

export const PermohonanSKLUpdateStatus = ({
  id,
  status,
}: PermohonanSKLUpdateStatusProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<StatusPermohonan>(status);

  const handleUpdateStatus = async (newStatus: StatusPermohonan) => {
    if (newStatus === currentStatus) return;

    try {
      setLoading(true);
      const response = await updatePermohonanSKLStatusAction(id, {
        statusPermohonan: newStatus,
        nomorPermohonan: "",
        catatan: "",
      });
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
    DIAJUKAN: { label: "Diajukan", variant: "secondary" },
    DISETUJUI: { label: "Disetujui", variant: "default" },
    DITOLAK: { label: "Ditolak", variant: "destructive" },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <Badge variant={statusConfig[currentStatus].variant}>
            {statusConfig[currentStatus].label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(statusConfig).map(([statusKey, config]) => (
          <DropdownMenuItem
            key={statusKey}
            onClick={() => handleUpdateStatus(statusKey as StatusPermohonan)}
            disabled={loading || statusKey === currentStatus}
          >
            <Badge variant={config.variant} className="mr-2">
              {config.label}
            </Badge>
            {statusKey === currentStatus && " (Saat ini)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
