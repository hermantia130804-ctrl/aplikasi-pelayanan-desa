"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePermohonanSKLAction } from "@/lib/server/actions/permohonan-skl";
import { PermohonanSKL } from "@/generated/prisma";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanSKLDeleteModalProps = {
  permohonanSKL: PermohonanSKL;
};

export const PermohonanSKLDeleteModal = ({ permohonanSKL }: PermohonanSKLDeleteModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await deletePermohonanSKLAction(permohonanSKL.permohonanSKLId);
      if (response.status === 200) {
        toast.success(response.message);
        setOpen(false);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
        if (error instanceof Error) {
            return toast.error("Terjadi kesalahan pada server.");
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Permohonan SKL</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus permohonan SKL atas nama{" "}
              <strong>{permohonanSKL.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
