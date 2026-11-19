"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CekBansosUploadField } from "@/components/cek-bansos-upload-field";
import { updateStatusCekBansosAction } from "@/lib/server/actions/cek-bansos";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const statusOptions = [
  { value: "DIAJUKAN", label: "Diajukan (menunggu proses)" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "SELESAI", label: "Selesai" },
];

export function CekBansosTindakLanjut({
  cekBansosId,
  statusPermohonan,
  alasanDitolak,
  keteranganSelesai,
  fotoHasilUrl,
}: {
  cekBansosId: string;
  statusPermohonan: string;
  alasanDitolak: string;
  keteranganSelesai: string;
  fotoHasilUrl: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(statusPermohonan);
  const [alasan, setAlasan] = useState(alasanDitolak);
  const [keterangan, setKeterangan] = useState(keteranganSelesai);
  const [fotoHasil, setFotoHasil] = useState(fotoHasilUrl);

  const onSimpan = async () => {
    if (status === "DITOLAK" && alasan.trim().length < 3) return toast.error("Alasan penolakan wajib diisi (minimal 3 karakter)");
    if (status === "SELESAI") {
      if (keterangan.trim().length < 3) return toast.error("Keterangan hasil wajib diisi (minimal 3 karakter)");
      if (!fotoHasil) return toast.error("Foto hasil pengecekan wajib diunggah");
    }
    try {
      setLoading(true);
      const res = await updateStatusCekBansosAction(cekBansosId, {
        statusPermohonan: status,
        alasanDitolak: status === "DITOLAK" ? alasan : undefined,
        keteranganSelesai: status === "SELESAI" ? keterangan : undefined,
        fotoHasilUrl: status === "SELESAI" ? fotoHasil : undefined,
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
      <div className="flex flex-col gap-4">
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
        {status === "DITOLAK" && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Alasan Penolakan (wajib)</Label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Tulis alasan penolakan untuk pemohon"
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
            />
          </div>
        )}
        {status === "SELESAI" && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Keterangan Hasil (wajib)</Label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Hasil pengecekan kelayakan bansos"
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Foto Hasil Pengecekan (wajib) — JPG/PNG/WebP, maksimal 2 MB</Label>
              <CekBansosUploadField value={fotoHasil} onChange={setFotoHasil} />
            </div>
          </>
        )}
      </div>
      <Button onClick={onSimpan} disabled={loading} className="mt-4">
        {loading ? (
          <><Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...</>
        ) : (
          <><Save className="mr-2 size-4" /> Simpan Tindak Lanjut</>
        )}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Pemohon akan menerima email pemberitahuan setelah status disimpan, dan bisa melihat hasil di menu Status Cek Bansos.
      </p>
    </div>
  );
}
