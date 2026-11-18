'use client';

import { Fragment, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileDown, Save, Printer, Eye, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";
import { lampidBulananAction } from "@/lib/server/actions/lampid-bulanan";
import { LOGO_KAB_BOGOR_BASE64 as logoKabBogorBase64 } from "@/assets/logo-kab-bogor.base64";

const BULAN_OPTIONS = [
  { value: "1", label: "JANUARI" }, { value: "2", label: "FEBRUARI" },
  { value: "3", label: "MARET" }, { value: "4", label: "APRIL" },
  { value: "5", label: "MEI" }, { value: "6", label: "JUNI" },
  { value: "7", label: "JULI" }, { value: "8", label: "AGUSTUS" },
  { value: "9", label: "SEPTEMBER" }, { value: "10", label: "OKTOBER" },
  { value: "11", label: "NOVEMBER" }, { value: "12", label: "DESEMBER" },
];

interface RowData {
  rw: string; rt: string; isSubtotal: boolean; isGrandTotal: boolean;
  jmlPddkBlnLalu: { lk: number; pr: number; jml: number };
  lahir: { lk: number; pr: number; jml: number };
  mati: { lk: number; pr: number; jml: number };
  datang: { lk: number; pr: number; jml: number };
  pindah: { lk: number; pr: number; jml: number };
  jmlPddkBlnIni: { lk: number; pr: number; jml: number };
  kk: { wajib: number; memiliki: number; belum: number };
  ktp: { wajib: number; memiliki: number; belum: number };
}

interface LampidData {
  bulan: number; tahun: number; bulanLabel: string; tanggalCetak: string;
  rows: RowData[];
  agamaRows: Array<{ label: string; lk: number; pr: number; jml: number }>;
  agamaTotal: { lk: number; pr: number; jml: number };
}

interface SavedItem {
  id: number; bulan: number; tahun: number; bulanLabel: string;
  keterangan: string; createdAt: string;
}

export default function LampidBulananView() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [data, setData] = useState<LampidData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedList, setSavedList] = useState<SavedItem[]>([]);
  const [showRiwayat, setShowRiwayat] = useState(false);

  const fetchSavedList = useCallback(async () => {
    try {
      const r = await lampidBulananAction("listSaved", {});
      if (r.status === 200 && Array.isArray(r.data)) setSavedList(r.data as SavedItem[]);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchSavedList(); }, [fetchSavedList]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const r = await lampidBulananAction("generate", {
        bulan: parseInt(bulan), tahun: parseInt(tahun),
      });
      if (r.status === 200 && r.data) setData(r.data as LampidData);
      else toast.error(r.error || "Gagal membuat laporan");
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const r = await lampidBulananAction("save", {
        bulan: data.bulan, tahun: data.tahun,
      });
      if (r.status === 200) {
        toast.success(r.message);
        fetchSavedList();
      } else toast.error(r.error || "Gagal menyimpan");
    } catch (e) { toast.error("Terjadi kesalahan"); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await lampidBulananAction("export", {
        bulan: parseInt(bulan), tahun: parseInt(tahun),
      });
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
    const printContents = document.getElementById("print-area")?.innerHTML;
    if (!printContents) return;
    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) { toast.error("Popup diblokir browser"); return; }
    win.document.write(`
      <html><head><title>Laporan Lampid Bulanan ${data.bulanLabel} ${data.tahun}</title>
      <style>
        @page { size: A4 landscape; margin: 0.5cm; }
        body { font-family: Arial, sans-serif; font-size: 8px; color: #000; margin: 8px; }
        table.lampid { border-collapse: collapse; width: 100%; table-layout: fixed; }
        table.lampid th, table.lampid td { border: 1px solid #000; padding: 2px; text-align: center; overflow: hidden; }
        table.lampid th { background: #f0f0f0; font-weight: bold; }
        table.lampid td.rw-cell, table.lampid td.rt-cell { font-weight: bold; }
        table.lampid tr.subtotal td { background: #f5f5f5; font-weight: bold; }
        table.lampid tr.grand-total td { background: #e0e0e0; font-weight: bold; }
        .header-block { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
        .header-block img { width: 60px; height: 60px; object-fit: contain; }
        .header-block .header-text { font-size: 11px; text-align: left; }
        .header-block .header-text .title { font-weight: bold; font-size: 13px; }
        .signature { text-align: center; font-size: 10px; width: 240px; }
        .signature .name { font-weight: bold; text-decoration: underline; margin-top: 50px; }
        .agama-section { font-size: 9px; }
        .agama-section table { border-collapse: collapse; }
        .agama-section th, .agama-section td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
        .agama-section th { background: #fff2cc; font-weight: bold; }
      </style></head><body>${printContents}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleLoadSaved = async (id: number) => {
    try {
      const r = await lampidBulananAction("loadSaved", { id });
      if (r.status === 200 && r.data) {
        setData(r.data as LampidData);
        setBulan(String((r.data as LampidData).bulan));
        setTahun(String((r.data as LampidData).tahun));
        setShowRiwayat(false);
        toast.success("Laporan dimuat");
      } else toast.error(r.error || "Gagal memuat");
    } catch (e) { toast.error("Terjadi kesalahan"); }
  };

  const handleDeleteSaved = async (id: number) => {
    if (!confirm("Hapus laporan tersimpan ini?")) return;
    try {
      const r = await lampidBulananAction("deleteSaved", { id });
      if (r.status === 200) { toast.success(r.message); fetchSavedList(); }
      else toast.error(r.error || "Gagal hapus");
    } catch (e) { toast.error("Terjadi kesalahan"); }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Laporan Lampid Bulanan</h1>
          <p className="text-sm text-muted-foreground">Laporan Penduduk per RT/RW (akumulasi seluruh RT di Desa Sukamaju)</p>
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
              <div id="print-area" className="overflow-x-auto">
                {/* Header: logo kiri + LAPORAN PENDUDUK/BULAN/TAHUN (kop tetap) */}
                <div className="flex items-start gap-4 mb-3">
                  <img src={logoKabBogorBase64} alt="Logo Kab. Bogor" className="h-20 w-20 object-contain flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-base">LAPORAN PENDUDUK</p>
                    <p className="text-sm">BULAN : {data.bulanLabel}</p>
                    <p className="text-sm">TAHUN : {data.tahun}</p>
                  </div>
                </div>

                {/* Tabel utama — layout sama persis dengan sheet Excel JULI 2026
                    Struktur:
                      - RW, RT (rowSpan=2)
                      - 6 grup × 3 sub-kolom (Lk/Pr/Jml): Jml Pddk Bln Lalu, Lahir, Mati, Datang, Pindah, Jml.Pddk Bln ini
                      - 2 grup × 3 sub-kolom (Wajib/Memiliki/Belum): Kartu Keluarga, Kartu Tanda Penduduk
                    Total kolom: 2 + (6×3) + (2×3) = 26 */}
                <table className="lampid w-full text-[10px] border-collapse" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "4%" }} /> {/* RW */}
                    <col style={{ width: "5%" }} /> {/* RT */}
                    {/* 6 grup × 3 kolom = 18 kolom @ ~3.5% each */}
                    {Array.from({ length: 18 }).map((_, i) => (
                      <col key={`c18-${i}`} style={{ width: "3.5%" }} />
                    ))}
                    {/* 2 grup × 3 kolom = 6 kolom @ ~5% each */}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <col key={`c6-${i}`} style={{ width: "5%" }} />
                    ))}
                  </colgroup>
                  <thead>
                    {/* Baris header 1: nama grup dengan colSpan=3, RW & RT dengan rowSpan=2 */}
                    <tr className="bg-muted">
                      <th rowSpan={2} className="border p-1 text-center font-bold">RW</th>
                      <th rowSpan={2} className="border p-1 text-center font-bold">RT</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Jml Pddk Bln Lalu</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Lahir</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Mati</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Datang</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Pindah</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Jml.Pddk Bln ini</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Kartu Keluarga</th>
                      <th colSpan={3} className="border p-1 text-center font-bold">Kartu Tanda Penduduk</th>
                    </tr>
                    {/* Baris header 2: sub-kolom per grup
                        - 6 grup pertama: Lk, Pr, Jml (total 18 cells)
                        - 2 grup terakhir: Wajib, Memiliki, Belum (total 6 cells)
                        Total = 24 cells (sesuai 24 effective kolom setelah RW+RT di rowSpan) */}
                    <tr className="bg-muted">
                      {/* 6 grup × Lk/Pr/Jml = 18 cells */}
                      {Array.from({ length: 6 }).map((_, gi) => (
                        <Fragment key={`hdr-grp-${gi}`}>
                          <th className="border p-1 text-center font-bold">Lk</th>
                          <th className="border p-1 text-center font-bold">Pr</th>
                          <th className="border p-1 text-center font-bold">Jml</th>
                        </Fragment>
                      ))}
                      {/* KK: Wajib, Memiliki, Belum */}
                      <th className="border p-1 text-center font-bold">Wajib</th>
                      <th className="border p-1 text-center font-bold">Memiliki</th>
                      <th className="border p-1 text-center font-bold">Belum</th>
                      {/* KTP: Wajib, Memiliki, Belum */}
                      <th className="border p-1 text-center font-bold">Wajib</th>
                      <th className="border p-1 text-center font-bold">Memiliki</th>
                      <th className="border p-1 text-center font-bold">Belum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, idx) => {
                      const cls = row.isGrandTotal ? "grand-total" : row.isSubtotal ? "subtotal" : "";
                      const rtLabel = row.isGrandTotal ? "Jml.Ttl" : row.isSubtotal ? "Jumlah" : row.rt;
                      const groups = [row.jmlPddkBlnLalu, row.lahir, row.mati, row.datang, row.pindah, row.jmlPddkBlnIni];
                      return (
                        <tr key={idx} className={cls}>
                          {/* RW hanya ditampilkan jika row.rw !== "" (sudah di-set backend hanya di baris pertama grup RW) */}
                          <td className="border p-1 text-center font-bold">{row.rw || ""}</td>
                          <td className="border p-1 text-center font-medium">{rtLabel}</td>
                          {/* 6 grup × Lk/Pr/Jml */}
                          {groups.map((g, gi) => (
                            <Fragment key={`body-grp-${gi}`}>
                              <td className="border p-1 text-center">{g.lk}</td>
                              <td className="border p-1 text-center">{g.pr}</td>
                              <td className="border p-1 text-center">{g.jml}</td>
                            </Fragment>
                          ))}
                          {/* KK: Wajib, Memiliki, Belum */}
                          <td className="border p-1 text-center">{row.kk.wajib}</td>
                          <td className="border p-1 text-center">{row.kk.memiliki}</td>
                          <td className="border p-1 text-center">{row.kk.belum}</td>
                          {/* KTP: Wajib, Memiliki, Belum */}
                          <td className="border p-1 text-center">{row.ktp.wajib}</td>
                          <td className="border p-1 text-center">{row.ktp.memiliki}</td>
                          <td className="border p-1 text-center">{row.ktp.belum}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Signature + Penganut Agama */}
                <div className="flex justify-between mt-6 gap-6 flex-wrap">
                  <div className="flex-1 min-w-[400px]">
                    <p className="font-bold text-xs mb-2">PENGANUT GOLONGAN AGAMA</p>
                    <table className="text-[10px] border-collapse">
                      <thead>
                        <tr>
                          {data.agamaRows.slice(0, 4).map(a => (
                            <th key={`ag-${a.label}`} colSpan={3} className="border p-1 text-center bg-muted/50 font-bold">{a.label}</th>
                          ))}
                          <th colSpan={3} className="border p-1 text-center bg-muted/50 font-bold">JUMLAH</th>
                        </tr>
                        <tr>
                          {Array.from({ length: Math.min(5, data.agamaRows.length + 1) }).map((_, i) => (
                            <Fragment key={`ag-sub-${i}`}>
                              <th className="border p-1 text-center bg-muted/50 font-bold">L</th>
                              <th className="border p-1 text-center bg-muted/50 font-bold">P</th>
                              <th className="border p-1 text-center bg-muted/50 font-bold">JML</th>
                            </Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {data.agamaRows.slice(0, 4).map(a => (
                            <Fragment key={`ag-val-${a.label}`}>
                              <td className="border p-1 text-center">{a.lk}</td>
                              <td className="border p-1 text-center">{a.pr}</td>
                              <td className="border p-1 text-center">{a.jml}</td>
                            </Fragment>
                          ))}
                          <td className="border p-1 text-center font-bold">{data.agamaTotal.lk}</td>
                          <td className="border p-1 text-center font-bold">{data.agamaTotal.pr}</td>
                          <td className="border p-1 text-center font-bold">{data.agamaTotal.jml}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-center text-xs w-64">
                    <p>SUKAMAJU, {data.tanggalCetak}</p>
                    <p className="mt-1">KEPALA DESA SUKAMAJU</p>
                    <div className="h-16" />
                    <p className="font-bold underline">Hj. CUCUM RATNA SUMINAR</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
