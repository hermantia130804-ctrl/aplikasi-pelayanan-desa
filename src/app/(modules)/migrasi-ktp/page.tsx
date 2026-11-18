"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { pendudukRTAction } from "@/lib/server/actions/penduduk-rt";
import { toast } from "sonner";

export default function MigrasiKtpPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number; skipped: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    if (!confirm("Jalankan migrasi KTP? Semua warga berusia 19+ tahun akan diupdate ke status PUNYA KTP.")) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await pendudukRTAction("migrateKtpStatus", {});
      if (r.status === 200) {
        setResult({
          updated: (r as any).updated ?? 0,
          skipped: (r as any).skipped ?? 0,
          total: (r as any).total ?? 0,
        });
        toast.success(r.message);
      } else {
        setError(r.error || "Gagal menjalankan migrasi");
        toast.error(r.error || "Gagal menjalankan migrasi");
      }
    } catch (e) {
      setError("Terjadi kesalahan");
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Migrasi Status KTP</h1>
        <p className="text-sm text-muted-foreground">
          Update semua data warga yang sudah ada di server: warga berusia 19 tahun atau di atasnya
          akan otomatis diupdate ke status KTP = PUNYA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eksekusi Migrasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Apa yang dilakukan migrasi ini?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Scan semua data warga di server</li>
              <li>Cek umur berdasarkan tanggal lahir</li>
              <li>Jika umur ≥ 19 tahun DAN status KTP bukan "PUNYA" → update ke "PUNYA"</li>
              <li>Warga di bawah 19 tahun tidak diubah</li>
            </ul>
          </div>

          <Button onClick={handleMigrate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menjalankan migrasi...
              </>
            ) : (
              "Jalankan Migrasi KTP"
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Migrasi selesai!</p>
                <p>Total warga di-scan: {result.total}</p>
                <p>Warga diupdate ke PUNYA: {result.updated}</p>
                <p>Warga tidak berubah: {result.skipped}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
