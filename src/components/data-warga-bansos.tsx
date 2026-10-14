"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { updateBansosAction } from "@/lib/server/actions/bansos-rt";
import { BANTUAN_OPTIONS, BPJS_OPTIONS, DESIL_OPTIONS } from "@/constants/data-warga";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, Shield } from "lucide-react";

type Warga = Record<string, unknown>;

export default function PendudukBansosRT({ isRT, isAdmin }: { isRT: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [target, setTarget] = useState<Warga | null>(null);
  const [bantuan, setBantuan] = useState<string[]>([]);
  const [bpjs, setBpjs] = useState("TIDAK");
  const [desil, setDesil] = useState("DESIL 1");

  const bolehUbah = isRT || isAdmin;

  const muat = async () => {
    setLoading(true);
    const res = await updateBansosAction ? await import("@/lib/server/actions/penduduk-rt").then(m => m.pendudukRTAction("list", {})) : null;
    if (res && res.status === 200) setData(res.data as Warga[]);
    setLoading(false);
  };

  useEffect(() => { muat(); }, []);

  const terfilter = data.filter((d) => {
    const q = search.toUpperCase();
    if (!q) return true;
    return String(d.namaLengkap ?? "").includes(q) || String(d.nik ?? "").includes(q) || String(d.noKk ?? "").includes(q);
  });

  const bukaUpdate = (d: Warga) => {
    setTarget(d);
    const b = Array.isArray(d.bantuan) ? (d.bantuan as string[]) : [];
    setBantuan(b.filter(x => x !== "TIDAK" && x !== ""));
    setBpjs(String(d.bpjs ?? "TIDAK"));
    setDesil(String(d.desil ?? "DESIL 1"));
    setShowForm(true);
  };

  const toggleBantuan = (b: string) => {
    setBantuan((prev) => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const simpan = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      const res = await updateBansosAction({ id: target.dataWargaId, bantuan, bpjs, desil });
      if (res.status === 200) {
        toast.success(res.message);
        setShowForm(false);
        muat(); router.refresh();
      } else toast.error(res.error || "Gagal menyimpan");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Terjadi kesalahan"); }
    finally { setSubmitting(false); }
  };

  const badgeBantuan = (d: Warga) => {
    const arr = Array.isArray(d.bantuan) ? (d.bantuan as string[]).filter(b => b !== "TIDAK" && b !== "") : [];
    return arr.map((b, i) => <Badge key={i} variant="outline" className="text-[9px] border-orange-300 text-orange-600">{b}</Badge>);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-emerald-800">Status Bantuan Sosial</h3>
          <Badge variant="secondary" className="text-xs">{terfilter.length} orang</Badge>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Cari nama/NIK/KK..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[240px]" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
      ) : terfilter.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">Belum ada data warga.</div>
      ) : (
        <div className="space-y-2">
          {terfilter.map((d) => (
            <Card key={String(d.dataWargaId)}><CardContent className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium">{String(d.namaLengkap)}</span>
                  <Badge variant="outline" className="text-[9px]">RT {String(d.noRt ?? "-")}</Badge>
                  {String(d.bpjs ?? "") !== "" && String(d.bpjs) !== "TIDAK" && (
                    <Badge className="text-[9px] bg-blue-100 text-blue-700">BPJS {String(d.bpjs)}</Badge>
                  )}
                  {String(d.desil ?? "") !== "" && <Badge variant="outline" className="text-[9px]">{String(d.desil)}</Badge>}
                  {badgeBantuan(d)}
                </div>
                <p className="text-[10px] text-muted-foreground">NIK: {String(d.nik)} · RT {String(d.noRt ?? "-")} / RW {String(d.noRw ?? "-")}</p>
              </div>
              {bolehUbah && (
                <Button size="sm" variant="outline" onClick={() => bukaUpdate(d)}>
                  <Shield className="h-3.5 w-3.5 mr-1" /> Bansos
                </Button>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Dialog Update Bansos */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Status Bantuan — {target ? String(target.namaLengkap) : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Bantuan Sosial</Label>
              <div className="flex flex-wrap gap-2">
                {BANTUAN_OPTIONS.filter(b => b !== "TIDAK").map((b) => (
                  <label key={b} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={bantuan.includes(b)} onCheckedChange={() => toggleBantuan(b)} />
                    <span className="text-xs">{b}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">BPJS</Label>
              <Select value={bpjs} onValueChange={setBpjs}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{BPJS_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Desil</Label>
              <Select value={desil} onValueChange={setDesil}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{DESIL_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Batal</Button>
            <Button onClick={simpan} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
