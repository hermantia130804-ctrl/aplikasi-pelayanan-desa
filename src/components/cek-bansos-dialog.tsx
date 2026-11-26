"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cekBansosPublikAction } from "@/lib/server/actions/cek-bansos-publik";

const HASH = "cek-bansos";

/**
 * Popup "Cek Bantuan dan Desil" — dipasang sekali di public layout.
 * Auto-buka saat URL hash = #cek-bansos (dipicu klik menu "Cek Bantuan dan Desil"
 * di dropdown desktop maupun mobile menu — keduanya pakai href="/#cek-bansos").
 *
 * Alur: input NIK (16 digit) -> submit -> server action panggil Sociomile (MINSOS)
 * -> jawaban terakhir bot ditampilkan di popup. Peringatan kalau NIK salah / bukan 16 digit.
 */
export function CekBansosDialog() {
  const [open, setOpen] = useState(false);
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Buka dialog kalau URL hash = #cek-bansos.
  useEffect(() => {
    function check() {
      if (window.location.hash.replace("#", "") === HASH) setOpen(true);
    }
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      // Bersihkan hash + reset state saat ditutup.
      if (window.location.hash.replace("#", "") === HASH) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      setResult(null);
      setError(null);
      setNik("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const trimmed = nik.trim();
    // Validasi client: NIK harus 16 digit angka.
    if (!/^\d{16}$/.test(trimmed)) {
      setError("NIK harus 16 digit angka.");
      return;
    }
    setLoading(true);
    try {
      const res = await cekBansosPublikAction(trimmed);
      if (res.ok && res.detail) {
        setResult(res.detail);
      } else {
        setError(res.error || "Gagal memeriksa bansos.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cek Bantuan dan Desil</DialogTitle>
          <DialogDescription>
            Masukkan NIK (16 digit) untuk mengetahui status bantuan dan desil Anda dari Kemensos (MINSOS).
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/50 p-3 max-h-[45vh] overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Hasil Pengecekan</p>
              <p className="text-sm whitespace-pre-line leading-relaxed">{result}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setResult(null); setNik(""); }}>
              Cek NIK Lain
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="cek-bansos-nik" className="mb-1.5 block text-sm font-medium">
                Nomor Induk Kependudukan (NIK)
              </label>
              <Input
                id="cek-bansos-nik"
                inputMode="numeric"
                placeholder="Masukkan 16 digit NIK"
                value={nik}
                maxLength={16}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                aria-invalid={!!error}
              />
              {error && (
                <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || nik.length === 0}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memeriksa...</>
              ) : "Cek Sekarang"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Proses ±5–10 detik. Pastikan NIK benar (16 digit).
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
