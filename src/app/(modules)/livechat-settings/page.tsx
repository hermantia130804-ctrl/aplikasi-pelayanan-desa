"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Phone, CheckCircle2 } from "lucide-react";
import { getAllPetugasAction, toggleLivechatAgentAction } from "@/lib/server/actions/livechat";
import { toast } from "sonner";

interface Petugas {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  jabatan: string | null;
  tugasPetugas: string | null;
  isLivechatAgent: boolean;
}

export default function LivechatSettingsPage() {
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchPetugas = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAllPetugasAction();
      if (r.status === 200 && r.petugas) {
        setPetugasList(r.petugas as Petugas[]);
      }
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPetugas(); }, [fetchPetugas]);

  const handleToggle = async (userId: string, enabled: boolean) => {
    setToggling(userId);
    try {
      const r = await toggleLivechatAgentAction(userId, enabled);
      if (r.status === 200) {
        setPetugasList(prev => prev.map(p => p.userId === userId ? { ...p, isLivechatAgent: enabled } : p));
        toast.success(r.message);
      }
    } catch {
      toast.error("Gagal mengubah");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Pengaturan Livechat CS AI</h1>
        <p className="text-sm text-muted-foreground">Pilih petugas yang tersedia di livechat CS AI Desa Sukamaju.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Petugas</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : petugasList.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Belum ada petugas terdaftar.</p>
          ) : (
            <div className="space-y-2">
              {petugasList.map(p => {
                const tugas = p.tugasPetugas ? (() => { try { return JSON.parse(p.tugasPetugas).join(", "); } catch { return ""; } })() : "";
                const hasPhone = !!p.phone;
                return (
                  <div key={p.userId} className={`flex items-center gap-3 rounded-lg border p-3 ${p.isLivechatAgent ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
                    <Checkbox checked={p.isLivechatAgent} disabled={toggling === p.userId || !hasPhone} onCheckedChange={(c) => handleToggle(p.userId, c === true)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.jabatan || "Petugas"}{tugas && ` · ${tugas}`}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{hasPhone ? p.phone : <span className="text-red-500">No HP belum diisi</span>}</p>
                    </div>
                    {p.isLivechatAgent && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                    {toggling === p.userId && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
