"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDataWargaAction, updateDataWargaAction } from "@/lib/server/actions/data-warga";
import { JENIS_KELAMIN, AGAMA, PENDIDIKAN, PEKERJAAN, STATUS_PERKAWINAN, STATUS_KELUARGA, STATUS_KTP, BPJS_OPTIONS, DESIL_OPTIONS, ALAMAT_DEFAULT } from "@/constants/data-warga";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeftIcon, Loader2, Save } from "lucide-react";
import Link from "next/link";

type Props = { dataWargaId?: string; defaultValues: Record<string, string | Date> };

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Txt({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function DataWargaForm({ dataWargaId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState<Record<string, string>>(defaultValues as Record<string, string>);
  const sel = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const onSimpan = async () => {
    try {
      setLoading(true);
      const payload = { ...f, bantuan: [] };
      const res = dataWargaId ? await updateDataWargaAction(dataWargaId, payload) : await createDataWargaAction(payload);
      if (res.status === 200) { toast.success(res.message); router.push("/data-warga"); router.refresh(); }
      else toast.error(res.message || "Gagal menyimpan");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Txt label="Nama Lengkap *" value={f.namaLengkap ?? ""} onChange={sel("namaLengkap")} />
        <Txt label="NIK (16 digit) *" value={f.nik ?? ""} onChange={sel("nik")} />
        <Txt label="No. KK (16 digit) *" value={f.noKk ?? ""} onChange={sel("noKk")} />
        <Sel label="Jenis Kelamin *" value={f.jenisKelamin ?? "LAKI-LAKI"} onChange={sel("jenisKelamin")} options={JENIS_KELAMIN} />
        <Sel label="Status Keluarga *" value={f.statusKeluarga ?? "KEPALA KELUARGA"} onChange={sel("statusKeluarga")} options={STATUS_KELUARGA} />
        <Sel label="Agama *" value={f.agama ?? "ISLAM"} onChange={sel("agama")} options={AGAMA} />
        <Txt label="Tempat Lahir *" value={f.tempatLahir ?? ""} onChange={sel("tempatLahir")} />
        <Txt label="Tanggal Lahir *" type="date" value={String(f.tanggalLahir ?? "").slice(0, 10)} onChange={sel("tanggalLahir")} />
        <Sel label="Pendidikan *" value={f.pendidikan ?? "SD/SEDERAJAT"} onChange={sel("pendidikan")} options={PENDIDIKAN} />
        <Sel label="Pekerjaan *" value={f.pekerjaan ?? "BELUM/TIDAK BEKERJA"} onChange={sel("pekerjaan")} options={PEKERJAAN} />
        <Sel label="Status Perkawinan *" value={f.statusPerkawinan ?? "BELUM MENIKAH"} onChange={sel("statusPerkawinan")} options={STATUS_PERKAWINAN} />
        <Sel label="Punya KTP" value={f.punyaKtp ?? "BELUM"} onChange={sel("punyaKtp")} options={STATUS_KTP} />
        <Txt label="Nama Ayah *" value={f.namaAyah ?? ""} onChange={sel("namaAyah")} />
        <Txt label="Nama Ibu *" value={f.namaIbu ?? ""} onChange={sel("namaIbu")} />
        <Txt label="Nama Panggilan" value={f.namaPanggilan ?? ""} onChange={sel("namaPanggilan")} />
        <Txt label="No. HP" value={f.noHp ?? ""} onChange={sel("noHp")} />
        <Sel label="BPJS" value={f.bpjs ?? "TIDAK"} onChange={sel("bpjs")} options={BPJS_OPTIONS} />
        <Sel label="Desil" value={f.desil ?? "DESIL 1"} onChange={sel("desil")} options={DESIL_OPTIONS} />
        <div className="sm:col-span-2 lg:col-span-3"><Txt label="Alamat *" value={f.alamat ?? ALAMAT_DEFAULT} onChange={sel("alamat")} /></div>
        <Txt label="Keterangan" value={f.keterangan ?? ""} onChange={sel("keterangan")} />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" asChild><Link href="/data-warga"><ArrowLeftIcon className="w-4 h-4" /> Kembali</Link></Button>
        <Button type="button" onClick={onSimpan} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 size-4" /> Simpan</>}
        </Button>
      </div>
    </div>
  );
}
