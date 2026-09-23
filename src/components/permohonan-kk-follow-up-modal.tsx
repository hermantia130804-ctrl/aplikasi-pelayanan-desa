"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { followUpPermohonanKKActionV2 as followUpPermohonanKKAction } from "@/lib/server/actions/permohonan-kk";
import { ClipboardCheck, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan", color: "bg-yellow-100 text-yellow-800" },
  { value: "DISETUJUI", label: "Disetujui", color: "bg-blue-100 text-blue-800" },
  { value: "DITOLAK", label: "Ditolak", color: "bg-red-100 text-red-800" },
];

type PermohonanKKFollowUpModalProps = {
  permohonanKKId: string;
  statusPermohonan: string;
  catatan?: string;
  nomorPermohonan?: string;
};

export const PermohonanKKFollowUpModal = ({
  permohonanKKId,
  statusPermohonan,
  catatan,
  nomorPermohonan,
}: PermohonanKKFollowUpModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(statusPermohonan);
  const [nomor, setNomor] = useState(nomorPermohonan ?? "");
  const [isiCatatan, setIsiCatatan] = useState(catatan ?? "");

  const onSubmit = async () => {
    try {
      setLoading(true);
      const res = await followUpPermohonanKKAction({
        permohonanKKId,
        statusPermohonan: status as "DIAJUKAN" | "DISETUJUI" | "DITOLAK",
        nomorPermohonan: nomor || undefined,
        catatan: isiCatatan || undefined,
      });
      if (res.status === 200) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setLoading(false);
      setOpen(false);
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <ClipboardCheck className="w-4 h-4 mr-1" />
          Tindak Lanjut
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader className="flex flex-col items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-primary mx-auto" />
          <DialogTitle className="text-center">Tindak Lanjut Permohonan KK</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Pilih status terbaru permohonan dan berikan catatan jika diperlukan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Status Permohonan</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-12 text-base w-full">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nomor Permohonan</label>
            <Input
              placeholder="Masukkan nomor permohonan"
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Catatan</label>
            <Textarea
              placeholder="Tulis catatan untuk pemohon atau internal (opsional)"
              className="min-h-[90px] text-base"
              value={isiCatatan}
              onChange={(e) => setIsiCatatan(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              <X className="w-4 h-4 mr-1" />
              Batal
            </Button>
            <Button type="button" onClick={onSubmit} disabled={loading} className="flex items-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              <Save className="w-4 h-4 mr-1" />
              Simpan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
