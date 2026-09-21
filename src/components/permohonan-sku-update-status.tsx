"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { followUpPermohonanSKUAction } from "@/lib/server/actions/permohonan-sku";
import { PermohonanSKU, StatusPermohonan } from "@/generated/prisma";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanSKUWithUser = PermohonanSKU & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
};

interface PermohonanSKUUpdateStatusProps {
  permohonan: PermohonanSKUWithUser;
}

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan", color: "text-yellow-600" },
  { value: "DIPROSES", label: "Diproses", color: "text-blue-600" },
  { value: "DISETUJUI", label: "Disetujui", color: "text-green-600" },
  { value: "DITOLAK", label: "Ditolak", color: "text-red-600" },
];

export function PermohonanSKUUpdateStatus({
  permohonan,
}: PermohonanSKUUpdateStatusProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: StatusPermohonan) => {
    if (newStatus === permohonan.statusPermohonan) return;

    try {
      setIsLoading(true);
      const result = await followUpPermohonanSKUAction({
        permohonanSKUId: permohonan.permohonanSKUId,
        statusPermohonan: newStatus,
      });

      if (result.status === 200) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatus = statusOptions.find(
    (option) => option.value === permohonan.statusPermohonan
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <span className={currentStatus?.color}>
                {currentStatus?.label}
              </span>
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusUpdate(option.value as StatusPermohonan)}
            className={option.color}
            disabled={option.value === permohonan.statusPermohonan}
          >
            {option.label}
            {option.value === permohonan.statusPermohonan && " (Saat ini)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
