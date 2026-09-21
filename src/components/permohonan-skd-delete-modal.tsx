"use client";

import { PermohonanSKD } from "@/generated/prisma";
import { deletePermohonanSKDAction } from "@/lib/server/actions/permohonan-skd";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

type PermohonanSKDWithUser = PermohonanSKD & {
  user: {
    userId: string;
    name: string;
    email: string;
  };
};

interface PermohonanSKDDeleteModalProps {
  permohonan: PermohonanSKDWithUser;
  children: React.ReactNode;
}

export function PermohonanSKDDeleteModal({ permohonan, children }: PermohonanSKDDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const result = await deletePermohonanSKDAction(permohonan.permohonanSKDId);
      
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
      }
    } catch (error) {
      toast.error("Gagal menghapus permohonan SKD");
      console.error("Delete error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Permohonan SKD</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus permohonan SKD atas nama{" "}
            <span className="font-semibold">{permohonan.nama}</span>?
            <br />
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
