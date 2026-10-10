"use client";

import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { sementaraRTAction } from "@/lib/server/actions/penduduk-sementara-rt";
import { AGAMA, PENDIDIKAN, PEKERJAAN, STATUS_PERKAWINAN, JENIS_KELAMIN, ALAMAT_DEFAULT } from "@/constants/data-warga";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2, Pencil, FileUp, FileDown } from "lucide-react";

const STATUS_OPSI = ["KONTRAK", "SEWA", "MENUMPANG", "KOS", "NUMPANG KELUARGA"];

export default function PendudukSementaraRT({ isRT, isAdmin }: { isRT: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [f, setF] = useState<Record<string, string>>({});

  const muat = async () => {
    setLoading(true);
    const res = await sementaraRTAction("list", { search, statusKet: filterStatus });
    if (res.status === 200) setData((res.data as unknown as Array<Record<string, unknown>>) ?? []);
    setLoading(false);
  };

  const openTambah = () => {
    setEditingId(null);
    setF({
      namaLengkap: "", nik: "", noKk: "", jenisKelamin: "LAKI-LAKI",
      statusKeluarga: "LAINNYA", tempatLahir: "", tanggalLahir: "",
      agama: "ISLAM", pendidikan: "TIDAK/BELUM SEKOLAH", pekerjaan: "BELUM/TIDAK BEKERJA",
      statusPerkawinan: "BELUM MENIKAH", namaPanggilan: "", noHp: "",
      statusKeterangan: "KONTRAK", alamatAsal: "", alamat: ALAMAT_DEFAULT,
      tanggalMasuk: new Date().toISOString().slice(0, 10), tanggalKeluar: "", keterangan: "",
    });
    setShowForm(true);
  };

  const openEdit = (d: Record<string, unknown>) => {
    setEditingId(String(d.pendudukSementaraId));
    setF({
      ...d,
      tanggalLahir: String(d.tanggalLahir).split("T")[0],
      tanggalMasuk: String(d.tanggalMasuk).split("T")[0],
      tanggalKeluar: d.tanggalKeluar ? String(d.tanggalKeluar).split("T")[0] : "",
    } as Record<string, string>);
    setShowForm(true);
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus data penduduk sementara ini?")) return;
    const res = await sementaraRTAction("delete", { id });
    if (res.status === 200) { toast.success(res.message); muat(); router.refresh(); }
    else toast.error(res.error || "Gagal menghapus");
  };

  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleDeleteAll = async () => {
    if (deleteAllText !== "HAPUS") return;
    setDeletingAll(true);
    try {
      const res = await sementaraRTAction("deleteAll", { konfirmasi: "HAPUS" });
      if (res.status === 200) { toast.success(res.message); setShowDeleteAll(false); setDeleteAllText(""); muat(); router.refresh(); }
      else toast.error(res.error || res.message || "Gagal menghapus");
    } catch { toast.error("Gagal menghapus"); }
    finally { setDeletingAll(false); }
  };

  const handleExport = () => {
    if (data.length === 0) { toast.error("Tidak ada data untuk diekspor"); return; }
    const headers = ["NO. KK", "NAMA", "NIK", "JK", "STATUS KK", "STATUS TINGGAL", "TGL LAHIR", "AGAMA", "PENDIDIKAN", "PEKERJAAN", "STATUS KAWIN", "ASAL", "TGL MASUK", "TGL KELUAR", "KETERANGAN"];
    const rows = data.map((d: Record<string, unknown>) => [
      String(d.noKk), String(d.namaLengkap), String(d.nik),
      String(d.jenisKelamin) === "LAKI-LAKI" ? "L" : "P",
      String(d.statusKeluarga), String(d.statusKeterangan),
      String(d.tanggalLahir).split("T")[0], String(d.agama),
      String(d.pendidikan), String(d.pekerjaan), String(d.statusPerkawinan),
      String(d.alamatAsal ?? ""), String(d.tanggalMasuk).split("T")[0],
      d.tanggalKeluar ? String(d.tanggalKeluar).split("T")[0] : "",
      String(d.keterangan ?? ""),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penduduk Sementara");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url; a.download = "penduduk-sementara-" + new Date().toISOString().slice(0, 10) + ".xlsx";
    a.click(); URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor (" + data.length + " orang)");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await sementaraRTAction("importExcel", fd);
      if (res.status === 200) {
        toast.success(res.message);
        if (res.errors && res.errors.length > 0) toast.warning(res.errors.slice(0, 3).join("; "), { duration: 10000 });
        muat(); router.refresh(); setShowImport(false);
      } else toast.error(res.error || "Gagal mengimpor");
    } catch { toast.error("Gagal mengimpor file"); }
    finally { setImporting(false); e.target.value = ""; }
  };

  const simpan = async () => {
    try {
      setLoading(true);
      const res = editingId
        ? await sementaraRTAction("update", { id: editingId, ...f })
        : await sementaraRTAction("create", f);
      if (res.status === 200) {
        toast.success(res.message);
        setShowForm(false);
        muat(); router.refresh();
      } else toast.error(res.error || res.message || "Gagal menyimpan");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-emerald-800">Penduduk Sementara</h3>
          <Badge variant="secondary" className="text-xs">{data.length} orang</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Cari nama/NIK/KK/asal..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[220px]" />
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); }}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA">Semua Status</SelectItem>
              {STATUS_OPSI.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {isRT && (
            <Button variant="outline" size="sm" onClick={() => setShowDeleteAll(true)} className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-1" /> HAPUS
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <FileDown className="h-4 w-4 mr-1" /> Ekspor
          </Button>
          {isRT && (
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <FileUp className="h-4 w-4 mr-1" /> Impor
            </Button>
          )}
          {(isRT || isAdmin) && (
            <Button size="sm" onClick={() => { openTambah(); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Button>
          )}
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={muat}>Muat Ulang</Button>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">Belum ada data penduduk sementara.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((d) => (
            <Card key={String(d.pendudukSementaraId)} className="overflow-hidden">
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{String(d.namaLengkap)}</p>
                  <Badge>{String(d.statusKeterangan)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">NIK: {String(d.nik)} · KK: {String(d.noKk)}</p>
                <p className="text-xs text-muted-foreground">Asal: {String(d.alamatAsal || "-")}</p>
                <p className="text-xs text-muted-foreground">
                  Masuk: {String(d.tanggalMasuk).split("T")[0]}
                  {d.tanggalKeluar ? " · Keluar: " + String(d.tanggalKeluar).split("T")[0] : " (masih tinggal)"}
                </p>
                <div className="flex gap-2 pt-1">
                  {(isRT || isAdmin) && (
                    <Button size="sm" variant="outline" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                  )}
                  {(isRT || isAdmin) && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => hapus(String(d.pendudukSementaraId))}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Penduduk Sementara" : "Tambah Penduduk Sementara"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Nama Lengkap *</Label>
              <Input value={f.namaLengkap ?? ""} onChange={(e) => setF((p) => ({ ...p, namaLengkap: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">NIK (16 digit) *</Label>
              <Input value={f.nik ?? ""} onChange={(e) => setF((p) => ({ ...p, nik: e.target.value }))} maxLength={16} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">No. KK (16 digit) *</Label>
              <Input value={f.noKk ?? ""} onChange={(e) => setF((p) => ({ ...p, noKk: e.target.value }))} maxLength={16} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Jenis Kelamin *</Label>
              <Select value={f.jenisKelamin} onValueChange={(v) => setF((p) => ({ ...p, jenisKelamin: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{JENIS_KELAMIN.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Status Keluarga *</Label>
              <Select value={f.statusKeluarga} onValueChange={(v) => setF((p) => ({ ...p, statusKeluarga: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="LAINNYA">LAINNYA</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Status Tinggal *</Label>
              <Select value={f.statusKeterangan} onValueChange={(v) => setF((p) => ({ ...p, statusKeterangan: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPSI.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Tempat Lahir *</Label>
              <Input value={f.tempatLahir ?? ""} onChange={(e) => setF((p) => ({ ...p, tempatLahir: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Tanggal Lahir *</Label>
              <Input type="date" value={f.tanggalLahir ?? ""} onChange={(e) => setF((p) => ({ ...p, tanggalLahir: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Agama *</Label>
              <Select value={f.agama} onValueChange={(v) => setF((p) => ({ ...p, agama: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{AGAMA.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Pendidikan *</Label>
              <Select value={f.pendidikan} onValueChange={(v) => setF((p) => ({ ...p, pendidikan: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{PENDIDIKAN.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Pekerjaan *</Label>
              <Select value={f.pekerjaan} onValueChange={(v) => setF((p) => ({ ...p, pekerjaan: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{PEKERJAAN.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Status Perkawinan *</Label>
              <Select value={f.statusPerkawinan} onValueChange={(v) => setF((p) => ({ ...p, statusPerkawinan: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_PERKAWINAN.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><Label className="text-sm">Alamat Asal *</Label>
              <Input value={f.alamatAsal ?? ""} onChange={(e) => setF((p) => ({ ...p, alamatAsal: e.target.value }))} placeholder="Alamat asal penduduk sementara" /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">No. HP</Label>
              <Input value={f.noHp ?? ""} onChange={(e) => setF((p) => ({ ...p, noHp: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Nama Panggilan</Label>
              <Input value={f.namaPanggilan ?? ""} onChange={(e) => setF((p) => ({ ...p, namaPanggilan: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Tanggal Masuk *</Label>
              <Input type="date" value={f.tanggalMasuk ?? ""} onChange={(e) => setF((p) => ({ ...p, tanggalMasuk: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label className="text-sm">Tanggal Keluar</Label>
              <Input type="date" value={f.tanggalKeluar ?? ""} onChange={(e) => setF((p) => ({ ...p, tanggalKeluar: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><Label className="text-sm">Alamat tinggal saat ini</Label>
              <Input value={f.alamat ?? ALAMAT_DEFAULT} onChange={(e) => setF((p) => ({ ...p, alamat: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><Label className="text-sm">Keterangan</Label>
              <Input value={f.keterangan ?? ""} onChange={(e) => setF((p) => ({ ...p, keterangan: e.target.value }))} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>Batal</Button>
            <Button onClick={simpan} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog Hapus Semua */}
      <AlertDialog open={showDeleteAll} onOpenChange={(o: boolean) => { setShowDeleteAll(o); if (!o) setDeleteAllText(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">⚠ Hapus SEMUA Penduduk Sementara?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">Seluruh data penduduk sementara wilayah Anda akan dihapus permanen.</span>
              <span className="block font-semibold text-red-600">Ketik <strong>HAPUS</strong> untuk konfirmasi:</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input type="text" value={deleteAllText} onChange={(e) => setDeleteAllText(e.target.value)} placeholder="HAPUS" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} disabled={deletingAll || deleteAllText !== "HAPUS"} className="bg-red-600 hover:bg-red-700">
              {deletingAll ? "Menghapus..." : "Ya, Hapus Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Impor */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Impor Data dari Excel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Kolom yang dibaca: NO. KK, NAMA, NIK, JK, STATUS KK, TGL LAHIR, AGAMA, PENDIDIKAN, PEKERJAAN, STATUS KAWIN, STATUS (tinggal), ASAL, MASUK, KELUAR, KETERANGAN.</p>
            <Input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={importing} />
            {importing && <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Mengimpor data...</div>}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
