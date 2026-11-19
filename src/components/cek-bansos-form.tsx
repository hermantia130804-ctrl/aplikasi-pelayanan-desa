"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CekBansosUploadField } from "@/components/cek-bansos-upload-field";
import { createCekBansosAction } from "@/lib/server/actions/cek-bansos";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export function CekBansosForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [namaKepalaKeluarga, setNama] = useState("");
  const [noKk, setNoKk] = useState("");
  const [nik, setNik] = useState("");
  const [fotoKkUrl, setFotoKkUrl] = useState("");

  const onSimpan = async () => {
    if (namaKepalaKeluarga.trim().length < 3) return toast.error("Nama Kepala Keluarga minimal 3 karakter");
    if (!/^\d{16}$/.test(noKk)) return toast.error("Nomor KK harus 16 digit angka");
    if (!/^\d{16}$/.test(nik)) return toast.error("NIK harus 16 digit angka");
    if (!fotoKkUrl) return toast.error("Foto KK wajib diunggah");
    try {
      setLoading(true);
      const res = await createCekBansosAction({ namaKepalaKeluarga, noKk, nik, fotoKkUrl });
      if (res.status === 200) {
        toast.success(res.message);
        router.push("/cek-bansos");
        router.refresh();
      } else {
        toast.error(res.message || "Gagal mengirim");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Nama Kepala Keluarga</Label>
        <Input value={namaKepalaKeluarga} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap kepala keluarga" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Nomor Kartu Keluarga (16 digit)</Label>
        <Input value={noKk} onChange={(e) => setNoKk(e.target.value)} inputMode="numeric" maxLength={16} placeholder="16 digit angka" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">NIK Kepala Keluarga (16 digit)</Label>
        <Input value={nik} onChange={(e) => setNik(e.target.value)} inputMode="numeric" maxLength={16} placeholder="16 digit angka" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Foto Kartu Keluarga (KK) — JPG/PNG/WebP, maksimal 2 MB</Label>
        <CekBansosUploadField value={fotoKkUrl} onChange={setFotoKkUrl} />
      </div>
      <Button onClick={onSimpan} disabled={loading}>
        {loading ? (
          <><Loader2 className="mr-2 size-4 animate-spin" /> Mengirim...</>
        ) : (
          <><Save className="mr-2 size-4" /> Kirim Pengajuan</>
        )}
      </Button>
    </div>
  );
}
