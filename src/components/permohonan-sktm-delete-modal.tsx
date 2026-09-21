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
import { deletePermohonanSKTMAction } from "@/lib/server/actions/permohonan-sktm";
import { PermohonanSKTM } from "@/generated/prisma";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanSKTMDeleteModalProps = {
  permohonanSKTM: PermohonanSKTM;
};

export const PermohonanSKTMDeleteModal = ({ permohonanSKTM }: PermohonanSKTMDeleteModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await deletePermohonanSKTMAction(permohonanSKTM.permohonanSKTMId);
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
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Permohonan SKTM</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus permohonan SKTM atas nama{" "}
              <strong>{permohonanSKTM.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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
