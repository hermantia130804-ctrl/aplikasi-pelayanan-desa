'use client';

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileDown, Save, Printer, Eye, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";
import { lampidUsiaAction } from "@/lib/server/actions/lampid-usia";
import { LOGO_KAB_BOGOR_BASE64 as logoKabBogorBase64 } from "@/assets/logo-kab-bogor.base64";

const BULAN_OPTIONS = [
  { value: "1", label: "JANUARI" }, { value: "2", label: "FEBRUARI" },
  { value: "3", label: "MARET" }, { value: "4", label: "APRIL" },
  { value: "5", label: "MEI" }, { value: "6", label: "JUNI" },
  { value: "7", label: "JULI" }, { value: "8", label: "AGUSTUS" },
  { value: "9", label: "SEPTEMBER" }, { value: "10", label: "OKTOBER" },
  { value: "11", label: "NOVEMBER" }, { value: "12", label: "DESEMBER" },
];

interface UsiaRow {
  no: number; label: string; lk: number; pr: number; jml: number; keterangan: string;
}

interface LampidUsiaData {
  bulan: number; tahun: number; bulanLabel: string; tanggalCetak: string;
  rows: UsiaRow[];
  total: { lk: number; pr: number; jml: number };
}

interface SavedItem {
  id: number; bulan: number; tahun: number; bulanLabel: string;
  keterangan: string; createdAt: string;
}

const ALAMAT_DESA = "Jl. KH. Abd. Hamid No.36 Cibungbulang Bogor – Kode pos (16630)";

export default function LampidUsiaView() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [data, setData] = useState<LampidUsiaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedList, setSavedList] = useState<SavedItem[]>([]);
  const [showRiwayat, setShowRiwayat] = useState(false);

  const fetchSavedList = useCallback(async () => {
    try {
      const r = await lampidUsiaAction("listSaved", {});
      if (r.status === 200 && Array.isArray(r.data)) setSavedList(r.data as SavedItem[]);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchSavedList(); }, [fetchSavedList]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const r = await lampidUsiaAction("generate", { bulan: parseInt(bulan), tahun: parseInt(tahun) });
      if (r.status === 200 && r.data) setData(r.data as LampidUsiaData);
      else toast.error(r.error || "Gagal membuat laporan");
    } catch (e) { toast.error("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const r = await lampidUsiaAction("save", { bulan: data.bulan, tahun: data.tahun });
      if (r.status === 200) { toast.success(r.message); fetchSavedList(); }
      else toast.error(r.error || "Gagal menyimpan");
    } catch (e) { toast.error("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await lampidUsiaAction("export", { bulan: parseInt(bulan), tahun: parseInt(tahun) });
      if (r.status === 200 && typeof r.data === "string" && r.filename) {
        const bin = atob(r.data);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = r.filename;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        toast.success("Excel berhasil diunduh");
      } else toast.error(r.error || "Gagal export");
    } catch (e) { toast.error("Terjadi kesalahan"); }
    finally { setExporting(false); }
  };

  const handlePrint = () => {
    if (!data) return;
    const printContents = document.getElementById("print-area-usia")?.innerHTML;
    if (!printContents) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { toast.error("Popup diblokir browser"); return; }
    win.document.write(`
      <html><head><title>Laporan Berdasarkan Usia ${data.bulanLabel} ${data.tahun}</title>
      <style>
        @page { size: A4 portrait; margin: 1.5cm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 4px 6px; text-align: center; }
        th { background: #4472C4; color: #fff; font-weight: bold; }
        .header-line { text-align: center; font-weight: bold; }
        .signature { text-align: center; margin-top: 30px; }
        .total-row { font-weight: bold; background: #B4C7E7; }
        img.logo { width: 70px; height: 70px; object-fit: contain; }
      </style></head><body>${printContents}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleLoadSaved = async (id: number) => {
    try {
      const r = await lampidUsiaAction("loadSaved", { id });
      if (r.status === 200 && r.data) {
        setData(r.data as LampidUsiaData);
        setBulan(String((r.data as LampidUsiaData).bulan));
        setTahun(String((r.data as LampidUsiaData).tahun));
        setShowRiwayat(false);
        toast.success("Laporan dimuat");
      } else toast.error(r.error || "Gagal memuat");
    } catch (e) { toast.error("Terjadi kesalahan"); }
  };

  const handleDeleteSaved = async (id: number) => {
    if (!confirm("Hapus laporan tersimpan ini?")) return;
    try {
      const r = await lampidUsiaAction("deleteSaved", { id });
      if (r.status === 200) { toast.success(r.message); fetchSavedList(); }
      else toast.error(r.error || "Gagal hapus");
    } catch (e) { toast.error("Terjadi kesalahan"); }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Laporan Berdasarkan Usia</h1>
          <p className="text-sm text-muted-foreground">Distribusi penduduk per kelompok umur (akumulasi seluruh RT)</p>
        </div>
        <Button variant="outline" onClick={() => setShowRiwayat(!showRiwayat)}>
          <Archive className="h-4 w-4 mr-2" /> Riwayat Tersimpan ({savedList.length})
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Buat Laporan</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium">Bulan</label>
              <Select value={bulan} onValueChange={setBulan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BULAN_OPTIONS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium">Tahun</label>
              <Input type="number" value={tahun} onChange={e => setTahun(e.target.value)} min={2020} max={2100} />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="sm:ml-2">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Buat Laporan
            </Button>
          </div>
        </CardContent>
      </Card>

      {showRiwayat && (
        <Card>
          <CardHeader><CardTitle className="text-base">Riwayat Laporan Tersimpan</CardTitle></CardHeader>
          <CardContent>
            {savedList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada laporan tersimpan.</p>
            ) : (
              <div className="space-y-2">
                {savedList.map(s => (
                  <div key={s.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <p className="text-sm font-medium">{s.bulanLabel} {s.tahun}</p>
                      <p className="text-xs text-muted-foreground">Disimpan: {new Date(s.createdAt).toLocaleString("id-ID")}</p>
                      {s.keterangan && <p className="text-xs">{s.keterangan}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleLoadSaved(s.id)}>Muat</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteSaved(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan Laporan
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Export Excel
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div id="print-area-usia" className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-center gap-4 mb-3">
                  <img src={logoKabBogorBase64} alt="Logo Kab. Bogor" className="h-20 w-20 object-contain" />
                  <div className="text-center">
                    <p className="font-bold text-sm">PEMERINTAH KABUPATEN BOGOR</p>
                    <p className="font-bold text-sm">KECAMATAN CIBUNGBULANG</p>
                    <p className="font-bold text-sm">DESA SUKAMAJU</p>
                    <p className="text-xs">Alamat : {ALAMAT_DESA}</p>
                  </div>
                </div>
                <p className="text-left font-bold text-base mb-1">LAPORAN PENDUDUK BERDASARKAN USIA</p>
                <p className="text-left text-sm mb-1">DESA : SUKAMAJU</p>
                <p className="text-left text-sm mb-1">BULAN : {data.bulanLabel}</p>
                <p className="text-left text-sm mb-3">TAHUN : {data.tahun}</p>

                {/* Tabel */}
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "#4472C4", color: "#fff" }}>
                      <th className="border p-2 text-white">No.</th>
                      <th className="border p-2 text-left text-white">Kelompok Umur</th>
                      <th className="border p-2 text-white">Laki-laki</th>
                      <th className="border p-2 text-white">Perempuan</th>
                      <th className="border p-2 text-white">Jumlah</th>
                      <th className="border p-2 text-white">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map(row => (
                      <tr key={row.no}>
                        <td className="border p-2 text-center">{row.no}</td>
                        <td className="border p-2">{row.label}</td>
                        <td className="border p-2 text-center">{row.lk}</td>
                        <td className="border p-2 text-center">{row.pr}</td>
                        <td className="border p-2 text-center font-medium">{row.jml}</td>
                        <td className="border p-2 text-center">{row.keterangan}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: "#B4C7E7" }}>
                      <td className="border p-2 text-center font-bold" colSpan={2}>Jumlah</td>
                      <td className="border p-2 text-center font-bold">{data.total.lk}</td>
                      <td className="border p-2 text-center font-bold">{data.total.pr}</td>
                      <td className="border p-2 text-center font-bold">{data.total.jml}</td>
                      <td className="border p-2 text-center font-bold">100%</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signature */}
                <div className="text-center text-sm mt-8 max-w-xs ml-auto">
                  <p>Sukamaju, {data.tanggalCetak}</p>
                  <p className="mt-1">Kepala Desa Sukamaju</p>
                  <div className="h-20" />
                  <p className="font-bold underline">Hj. CUCUM RATNA SUMINAR</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
