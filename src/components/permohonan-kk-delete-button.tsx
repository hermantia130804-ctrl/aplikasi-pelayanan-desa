"use client";

import { Button } from "@/components/ui/button";
import { deletePermohonanKKAction } from "@/lib/server/actions/permohonan-kk";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type PermohonanKKDeleteButtonProps = {
  permohonanKKId: string;
};

export const PermohonanKKDeleteButton = ({ permohonanKKId }: PermohonanKKDeleteButtonProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    const confirmed = window.confirm("Yakin ingin menghapus permohonan KK ini? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await deletePermohonanKKAction(permohonanKKId);
      if (response.status === 200) {
        toast.success(response.message);
        router.refresh();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menghapus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={onDelete} disabled={loading}>
      <TrashIcon className="text-red-500" />
    </Button>
  );
};
