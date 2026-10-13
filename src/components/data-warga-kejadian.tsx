"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { kejadianRTAction } from "@/lib/server/actions/kejadian-rt";
import { JENIS_KELAMIN, AGAMA, PENDIDIKAN, PEKERJAAN, STATUS_PERKAWINAN, STATUS_KELUARGA } from "@/constants/data-warga";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";

const JENIS_OPSI = ["LAHIR", "MATI", "PINDAH", "DATANG"];

type Item = Record<string, unknown> & { jenisKejadian: string; keterangan?: unknown; tanggal?: unknown; kejadianId?: string; };

export default function PendudukKejadianRT({ isRT, isAdmin }: { isRT: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [jenisTab, setJenisTab] = useState("LAHIR");
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [anggotaBaru, setAnggotaBaru] = useState<Record<string, string>[]>([]);

  const bisaEdit = isRT || isAdmin;

  const muat = async (jenis: string) => {
    setLoading(true);
    const res = await kejadianRTAction("list", { jenis });
    if (res.status === 200) setData(res.data as Item[]); else setData([]);
    setLoading(false);
  };

  const pilihTab = (j: string) => { setJenisTab(j); muat(j); };

  const bukaTambah = () => {
    setEditingId(null);
    setF({
      jenisKejadian: jenisTab, noKk: "", namaLengkap: "", nik: "", jenisKelamin: "LAKI-LAKI",
      tanggal: new Date().toISOString().slice(0, 10), keterangan: "",
      tanggalLahir: new Date().toISOString().slice(0, 10), tempatLahir: "",
    });
    setAnggotaBaru([]);
    setShowForm(true);
  };

  const bukaEdit = (d: Item) => {
    setEditingId(String(d.kejadianId));
    setF({
      jenisKejadian: String(d.jenisKejadian),
      noKk: String(d.noKk ?? ""), namaLengkap: String(d.namaLengkap),
      nik: String(d.nik ?? ""), jenisKelamin: String(d.jenisKelamin ?? ""),
      tanggal: String(d.tanggal).split("T")[0], keterangan: String(d.keterangan ?? ""),
    });
    setShowForm(true);
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus catatan kejadian ini?")) return;
    const res = await kejadianRTAction("delete", { id });
    if (res.status === 200) { toast.success(res.message); muat(jenisTab); router.refresh(); }
    else toast.error(res.error || "Gagal menghapus");
  };

  const simpan = async () => {
    try {
      setLoading(true);
      const payload: Record<string, string> = { ...f, jenisKejadian: f.jenisKejadian || jenisTab };
      const res = editingId
        ? await kejadianRTAction("update", { id: editingId, keterangan: payload.keterangan, tanggal: payload.tanggal } as unknown as Record<string, unknown>)
        : await kejadianRTAction("create", payload as unknown as Record<string, unknown>);
      if (res.status === 200) {
        toast.success(res.message);
        setShowForm(false);
        muat(jenisTab); router.refresh();
      } else toast.error(res.error || res.message || "Gagal menyimpan");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  const warna: Record<string, string> = { LAHIR: "bg-green-500", MATI: "bg-red-500", PINDAH: "bg-orange-500", DATANG: "bg-blue-500" };

  return (
    <div className="space-y-4">
      {/* Tab jenis */}
      <div className="grid grid-cols-4 gap-2">
        {JENIS_OPSI.map((j) => (
          <button key={j} onClick={() => pilihTab(j)}
            className={`rounded-lg p-2 text-center text-xs font-semibold text-white transition-colors ${warna[j]} ${jenisTab === j ? "ring-2 ring-offset-2 ring-emerald-500" : "opacity-60 hover:opacity-100"}`}>
            {j}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-emerald-800">Catatan {jenisTab}</h3>
        {bisaEdit && (
          <Button size="sm" onClick={bukaTambah} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1" /> Tambah {jenisTab}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">Belum ada catatan {jenisTab}.</div>
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <Card key={String(d.kejadianId)}><CardContent className="p-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{String(d.namaLengkap)}</p>
                <p className="text-xs text-muted-foreground">
                  {String(d.noKk ?? "")} · {String(d.jenisKelamin ?? "")} · {new Date(String(d.tanggal)).toLocaleDateString("id-ID")}
                  {d.keterangan ? " · " + String(d.keterangan) : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {bisaEdit && <Button size="sm" variant="outline" onClick={() => bukaEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>}
                {bisaEdit && <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => hapus(String(d.kejadianId))}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Dialog Tambah/Edit */}
      {showForm && (
        <Card className="border-2 border-emerald-200">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold">{editingId ? "Edit Catatan" : "Tambah Catatan"} — {jenisTab}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5"><Label className="text-sm">No. KK *</Label>
                <Input value={f.noKk ?? ""} onChange={(e) => setF((p) => ({ ...p, noKk: e.target.value.replace(/[^0-9]/g, "").slice(0, 16) }))} maxLength={16} placeholder="16 digit" /></div>
              <div className="flex flex-col gap-1.5"><Label className="text-sm">Tanggal {jenisTab} *</Label>
                <Input type="date" value={f.tanggal ?? ""} onChange={(e) => setF((p) => ({ ...p, tanggal: e.target.value }))} /></div>
              <div className="flex flex-col gap-1.5"><Label className="text-sm">Nama Lengkap *</Label>
                <Input value={f.namaLengkap ?? ""} onChange={(e) => setF((p) => ({ ...p, namaLengkap: e.target.value.toUpperCase() }))} /></div>
              <div className="flex flex-col gap-1.5"><Label className="text-sm">NIK {jenisTab === "LAHIR" ? "*" : ""}</Label>
                <Input value={f.nik ?? ""} onChange={(e) => setF((p) => ({ ...p, nik: e.target.value.replace(/[^0-9]/g, "").slice(0, 16) }))} maxLength={16} placeholder="16 digit" /></div>
              <div className="flex flex-col gap-1.5"><Label className="text-sm">Jenis Kelamin</Label>
                <Select value={f.jenisKelamin ?? "LAKI-LAKI"} onValueChange={(v) => setF((p) => ({ ...p, jenisKelamin: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{JENIS_KELAMIN.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {jenisTab === "LAHIR" && (
                <div className="flex flex-col gap-1.5"><Label className="text-sm">Tanggal Lahir Bayi *</Label>
                  <Input type="date" value={f.tanggalLahir ?? ""} onChange={(e) => setF((p) => ({ ...p, tanggalLahir: e.target.value }))} /></div>
              )}
              <div className="flex flex-col gap-1.5 sm:col-span-2"><Label className="text-sm">Keterangan</Label>
                <Input value={f.keterangan ?? ""} onChange={(e) => setF((p) => ({ ...p, keterangan: e.target.value }))} placeholder="Keterangan kejadian" /></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {jenisTab === "LAHIR" && "Bayi akan otomatis ditambahkan ke data penduduk dengan status ANAK."}
              {jenisTab === "MATI" && "Data penduduk yang meninggal akan otomatis dihapus dari data penduduk."}
              {jenisTab === "PINDAH" && "Data penduduk yang pindah akan otomatis dihapus dari data penduduk."}
              {jenisTab === "DATANG" && "Penduduk yang datang akan otomatis ditambahkan ke data penduduk."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>Batal</Button>
              <Button onClick={simpan} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Menyimpan...</> : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
