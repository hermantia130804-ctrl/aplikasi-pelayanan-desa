"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Save, Loader2, Edit3, CheckCircle2 } from "lucide-react";
import { updateDetailBansosAction } from "@/lib/server/actions/account";
import { toast } from "sonner";

const SOCIOMILE_URL = "https://chat.sociomile.com/livechat/6abd3eb90de3aa91408eb350?wbia=6285772646402::herman";

interface WelcomeBansosCardProps {
  nama: string;
  nik: string;
  detailBansos?: string | null;
}

export function WelcomeBansosCard({ nama, nik, detailBansos }: WelcomeBansosCardProps) {
  const [editing, setEditing] = useState(false);
  const [bansosText, setBansosText] = useState(detailBansos || "");
  const [saving, setSaving] = useState(false);
  const [savedText, setSavedText] = useState(detailBansos || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await updateDetailBansosAction(bansosText);
      if (r.status === 200) {
        setSavedText(bansosText.trim());
        setEditing(false);
        toast.success("Detail bansos berhasil disimpan");
      } else {
        toast.error("Gagal menyimpan detail bansos");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBansosText(savedText);
    setEditing(false);
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white">
      <CardContent className="p-6">
        {/* Baris 1: Selamat Datang */}
        <p className="text-center text-sm font-medium text-emerald-600 uppercase tracking-wide">
          Selamat Datang
        </p>

        {/* Baris 2: Nama pengguna */}
        <h2 className="text-center text-2xl font-bold text-gray-900 mt-1">
          {nama}
        </h2>

        {/* Baris 3: NIK */}
        <p className="text-center text-sm text-muted-foreground mt-1">
          NIK: {nik}
        </p>

        {/* Baris 4: Detail Bansos */}
        <div className="mt-4 border-t border-emerald-100 pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-center text-sm font-semibold text-gray-700">Detail Bansos</p>
            {savedText && !editing && (
              <button
                onClick={() => { setEditing(true); setBansosText(savedText); }}
                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            )}
          </div>

          {!editing ? (
            <div className="text-center">
              {savedText ? (
                <div className="whitespace-pre-line text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
                  {savedText}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Belum ada detail bansos. Cek bansos Anda:
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <a href={SOCIOMILE_URL} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-300">
                        <ExternalLink className="h-4 w-4 mr-1" /> Cek Bansos via Sociomile
                      </Button>
                    </a>
                    <Button
                      onClick={() => { setEditing(true); setBansosText(""); }}
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                    >
                      Input Manual
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <Textarea
                value={bansosText}
                onChange={e => setBansosText(e.target.value)}
                placeholder="Copy-paste hasil cek bansos dari Sociomile di sini..."
                className="text-sm min-h-[80px] resize-none"
                autoFocus
              />
              <div className="flex gap-2 mt-2 justify-center">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Simpan...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-1" /> Simpan</>
                  )}
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline">
                  Batal
                </Button>
              </div>
              <div className="mt-2 text-center">
                <a href={SOCIOMILE_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Buka Sociomile untuk cek bansos
                </a>
              </div>
            </div>
          )}

          {savedText && !editing && (
            <div className="mt-2 text-center">
              <a href={SOCIOMILE_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Cek ulang di Sociomile
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
