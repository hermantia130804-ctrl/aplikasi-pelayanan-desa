"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deletePermohonanSKUAction } from "@/lib/server/actions/permohonan-sku";
import { PermohonanSKU } from "@/generated/prisma";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "next/dist/server/api-utils";

type PermohonanSKUWithUser = PermohonanSKU & {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
};

interface PermohonanSKUDeleteModalProps {
  permohonan: PermohonanSKUWithUser;
}

export function PermohonanSKUDeleteModal({
  permohonan,
}: PermohonanSKUDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const result = await deletePermohonanSKUAction(permohonan.permohonanSKUId);

      if (result.status === 200) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hapus Permohonan SKU</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus permohonan SKU atas nama{" "}
            <span className="font-semibold">{permohonan.nama}</span>?
            <br />
            Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
