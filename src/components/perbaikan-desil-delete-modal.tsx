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
import { deletePerbaikanDesilAction } from "@/lib/server/actions/perbaikan-desil";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type PerbaikanDesilDeleteModalProps = {
  perbaikanDesilId: string;
};

export const PerbaikanDesilDeleteModal = ({ perbaikanDesilId }: PerbaikanDesilDeleteModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await deletePerbaikanDesilAction(perbaikanDesilId);
      if (response.status === 200) {
        toast.success(response.message);
        setOpen(false);
        router.refresh();
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
       <Trash2Icon className="text-red-500"/>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengajuan perbaikan desil ini? Seluruh foto juga akan terhapus dan tindakan ini tidak dapat dibatalkan.
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
