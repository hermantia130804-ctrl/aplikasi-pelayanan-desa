"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStatusPerbaikanDesilAction } from "@/lib/server/actions/perbaikan-desil";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan" },
  { value: "DISETUJUI", label: "Disetujui" },
  { value: "DITOLAK", label: "Ditolak" },
];

export function PerbaikanDesilTindakLanjut({
  perbaikanDesilId,
  statusPermohonan,
  catatan,
}: {
  perbaikanDesilId: string;
  statusPermohonan: string;
  catatan: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(statusPermohonan);
  const [isiCatatan, setIsiCatatan] = useState(catatan);

  const onSimpan = async () => {
    try {
      setLoading(true);
      const res = await updateStatusPerbaikanDesilAction(perbaikanDesilId, {
        statusPermohonan: status,
        catatan: isiCatatan || undefined,
      });
      if (res.status === 200) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menyimpan");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 font-bold">Tindak Lanjut Petugas</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Status Permohonan</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-sm">Catatan untuk pemohon</Label>
          <Input
            value={isiCatatan}
            onChange={(e) => setIsiCatatan(e.target.value)}
            placeholder="Contoh: Data akan diverifikasi oleh petugas desa"
          />
        </div>
      </div>
      <Button onClick={onSimpan} disabled={loading} className="mt-4">
        {loading ? (
          <><Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...</>
        ) : (
          <><Save className="mr-2 size-4" /> Simpan Tindak Lanjut</>
        )}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Warga akan otomatis menerima email pemberitahuan setelah status disimpan.
      </p>
    </div>
  );
}
