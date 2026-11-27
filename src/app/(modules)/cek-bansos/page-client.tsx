"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Save, Loader2, Search, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { updateDetailBansosAction } from "@/lib/server/actions/account";
import { toast } from "sonner";

const SOCIOMILE_URL = "https://chat.sociomile.com/livechat/6abd3eb90de3aa91408eb350?wbia=6285772646402::herman";

interface CekBansosPageProps {
  nama: string;
  nik: string;
  detailBansos?: string | null;
}

export default function CekBansosPage({ nama, nik, detailBansos }: CekBansosPageProps) {
  const [editing, setEditing] = useState(!detailBansos);
  const [bansosText, setBansosText] = useState(detailBansos || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!bansosText.trim()) {
      toast.error("Detail bansos tidak boleh kosong");
      return;
    }
    setSaving(true);
    try {
      const r = await updateDetailBansosAction(bansosText);
      if (r.status === 200) {
        setEditing(false);
        toast.success("Detail bansos berhasil disimpan");
      } else {
        toast.error("Gagal menyimpan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const copyNik = async () => {
    try {
      await navigator.clipboard.writeText(nik);
      setCopied(true);
      toast.success("NIK disalin ke clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin NIK");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Cek Status Bansos</h1>
        <p className="text-sm text-muted-foreground">
          Cek status bantuan sosial Anda dan simpan hasilnya
        </p>
      </div>

      {/* Data Pengguna */}
      <Card className="border-emerald-200">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm text-muted-foreground">Nama</p>
            <p className="font-semibold text-lg">{nama}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">NIK:</p>
              <p className="font-mono text-sm font-medium">{nik}</p>
              <button onClick={copyNik} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                {copied ? <><Check className="h-3 w-3" /> Disalin</> : <><Copy className="h-3 w-3" /> Salin</>}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Langkah Cek Bansos */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cara Cek Status Bansos</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p>Klik tombol di bawah untuk membuka <strong>Sociomile Live Chat</strong></p>
                <a href={SOCIOMILE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-emerald-600 hover:underline text-xs">
                  <ExternalLink className="h-3 w-3" /> Buka Sociomile Live Chat
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">2</span>
              <p>Kirim pesan: <code className="bg-gray-100 px-1 rounded">cek bansos</code></p>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">3</span>
              <p>Tunggu balasan, lalu masukkan NIK Anda: <code className="bg-gray-100 px-1 rounded">{nik}</code></p>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">4</span>
              <p>Copy hasil balasan, lalu paste di kolom di bawah ini</p>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Tombol buka Sociomile */}
      <a href={SOCIOMILE_URL} target="_blank" rel="noopener noreferrer">
        <Button className="w-full" size="lg">
          <ExternalLink className="h-5 w-5 mr-2" /> Buka Sociomile untuk Cek Bansos
        </Button>
      </a>

      {/* Detail Bansos — tampil atau edit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Detail Bansos</CardTitle>
            {detailBansos && !editing && (
              <Button size="sm" variant="ghost" onClick={() => { setEditing(true); setBansosText(detailBansos); }}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!editing ? (
            <div className="whitespace-pre-line text-sm bg-gray-50 rounded-lg p-4">
              {detailBansos}
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={bansosText}
                onChange={e => setBansosText(e.target.value)}
                placeholder="Paste hasil cek bansos dari Sociomile di sini..."
                className="min-h-[120px] resize-none text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving || !bansosText.trim()}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Simpan...</> : <><Save className="h-4 w-4 mr-1" /> Simpan</>}
                </Button>
                {detailBansos && (
                  <Button variant="outline" onClick={() => { setEditing(false); setBansosText(detailBansos); }}>
                    Batal
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
