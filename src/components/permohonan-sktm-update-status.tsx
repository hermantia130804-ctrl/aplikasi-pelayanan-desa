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
import { updateStatusPermohonanSKTMAction } from "@/lib/server/actions/permohonan-sktm";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanSKTMUpdateStatusProps = {
  permohonanSKTMId: string;
  status: StatusPermohonan;
};

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan", color: "bg-yellow-100 text-yellow-800" },
  { value: "DISETUJUI", label: "Disetujui", color: "bg-green-100 text-green-800" },
  { value: "DITOLAK", label: "Ditolak", color: "bg-red-100 text-red-800" },
];

export const PermohonanSKTMUpdateStatus = ({
  permohonanSKTMId,
  status,
}: PermohonanSKTMUpdateStatusProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<StatusPermohonan>(status);

  const handleUpdateStatus = async (newStatus: StatusPermohonan) => {
    if (newStatus === currentStatus) return;

    try {
      setLoading(true);
      const response = await updateStatusPermohonanSKTMAction({
        permohonanSKTMId,
        statusPermohonan: newStatus,
        catatan: `Status diubah menjadi ${newStatus}`,
      });
      if (response.status === 200) {
        toast.success(response.message);
        setCurrentStatus(newStatus);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Terjadi kesalahan pada server.");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          {loading ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Badge className={currentStatusOption?.color}>
                {currentStatusOption?.label}
              </Badge>
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleUpdateStatus(option.value as StatusPermohonan)}
            disabled={option.value === currentStatus}
          >
            <Badge className={option.color} variant="outline">
              {option.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
