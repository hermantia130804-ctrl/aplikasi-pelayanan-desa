"use client";

import { Button } from "@/components/ui/button";
import { deletePerbaikanDesilAction } from "@/lib/server/actions/perbaikan-desil";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export function PerbaikanDesilDeleteButton({ perbaikanDesilId }: { perbaikanDesilId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onHapus = async () => {
    if (!confirm("Hapus pengajuan ini permanen? Foto-foto juga ikut terhapus, dan tidak bisa dikembalikan.")) return;
    try {
      setLoading(true);
      const res = await deletePerbaikanDesilAction(perbaikanDesilId);
      if (res.status === 200) {
        toast.success(res.message);
        router.push("/kelola-perbaikan-desil");
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menghapus");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="destructive" onClick={onHapus} disabled={loading}>
      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
      Hapus Pengajuan
    </Button>
  );
}
