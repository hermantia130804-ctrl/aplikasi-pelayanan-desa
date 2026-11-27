#!/usr/bin/env node
/**
 * setup-cek-bansos-publik.js — fitur "Cek Bantuan dan Desil" POPUP di Beranda publik.
 *
 * Alur (sesuai permintaan user):
 *   - User klik menu "Cek Bantuan dan Desil" (di tab Layanan Masyarakat, desktop + mobile).
 *   - Tampil popup minta NIK.
 *   - User masukkan NIK -> program proses.
 *   - Program panggil chatbot Sociomile (MINSOS): kirim "cek bansos" -> tunggu 2 detik
 *     -> kirim NIK -> ambil jawaban terakhir.
 *   - Jawaban terakhir ditampilkan di popup.
 *   - Peringatan kalau NIK salah / NIK harus 16 digit.
 *
 * Cara kerja (CLEANEST — minim patch):
 *   - Menu "Cek Bantuan dan Desil" di layanan-dropdown.tsx: href diubah ke /#cek-bansos
 *     (cukup ubah 1 baris di array; desktop + mobile otomatis pakai href baru karena
 *     keduanya render <a href> dari array yang sama).
 *   - 1 komponen CekBansosDialog di public layout: auto-buka saat hash URL = #cek-bansos.
 *
 * Yang dilakukan installer:
 *   1. BUAT src/lib/server/services/sociomile-bansos.ts   (service fetchDetailBansosByNik, dgn jeda 2s)
 *   2. BUAT src/lib/server/actions/cek-bansos-publik.ts     (server action publik: validasi NIK +
 *      rate-limit per IP + panggil service; return detail atau error jelas)
 *   3. BUAT src/components/cek-bansos-dialog.tsx            (popup: input NIK + hasil + peringatan)
 *   4. PATCH src/components/layanan-dropdown.tsx            (ubah href menu -> /#cek-bansos)
 *   5. PATCH src/app/(public)/layout.tsx                    (render <CekBansosDialog/>)
 *   6. git add + commit + push  (Vercel auto-redeploy)
 *
 * Idempoten + CRLF-aware (Windows). Jalankan di root project.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const log = (m) => console.log(m);
const ok = (m) => console.log("  v " + m);
const skip = (m) => console.log("  [sudah] " + m);

// ---------- helpers ----------
function readRel(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}
function writeRel(rel, content, preserveCrlfOf) {
  const full = path.join(ROOT, rel);
  let out = content;
  if (preserveCrlfOf && preserveCrlfOf.includes("\r\n")) out = content.replace(/\n/g, "\r\n");
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, out);
}
function patchFile(rel, label, find, replace, alreadyMarker) {
  let raw = readRel(rel);
  if (!raw) { console.error("  x file tidak ada: " + rel); return false; }
  const hadCRLF = raw.includes("\r\n");
  const content = hadCRLF ? raw.replace(/\r\n/g, "\n") : raw;
  if (alreadyMarker && content.includes(alreadyMarker)) { skip(label); return true; }
  if (!content.includes(find)) {
    console.error("  x [SKIP] anchor tidak ketemu untuk: " + label);
    console.error("    cari: " + find.slice(0, 90).replace(/\n/g, "\\n"));
    return false;
  }
  let next = content.replace(find, replace);
  if (hadCRLF) next = next.replace(/\n/g, "\r\n");
  fs.writeFileSync(path.join(ROOT, rel), next);
  ok(label);
  return true;
}

// ---------- 1. service module ----------
const SVC_REL = "src/lib/server/services/sociomile-bansos.ts";
const SVC_CONTENT = `// Service: ambil detail bansos dari chatbot Kemensos (MINSOS) via REST Sociomile.
// Protokol dikonfirmasi via capture live widget (26 Nov 2026).
//
// Flow:
//   1. POST /talk2bot message="cek bansos"  -> bot balas "silakan input 16 digit NIK"
//   2. tunggu 2 detik
//   3. POST /talk2bot message=<NIK>          -> bot balas detail bansos (atau "NIK salah")
// Jawaban terakhir (langkah 3) = detail bansos yang ditampilkan.
//
// Endpoint: POST https://superchat.sociomile.net/talk2bot (application/x-www-form-urlencoded)
// Response: { status, messages: [{ type, text, callback_id }] }

const ROOM_ID = "6abd3eb90de3aa91408eb350";
const ENDPOINT = "https://superchat.sociomile.net/talk2bot";
const USER_NAME = "herman";
const USER_PHONE = "6285772646402";
const PREV_QUESTION = "ask_name";
const TRIGGER = "cek bansos";

function genUserId(): string {
  return \`\${Math.floor(Math.random() * 1000000)}_\${ROOM_ID}\`;
}

async function postTalk2bot(userId: string, message: string, retries = 2, delayMs = 2000): Promise<string> {
  const buildBody = () => new URLSearchParams({
    id: ROOM_ID,
    driver: "web",
    userId,
    message,
    question: "",
    attachment: "",
    interactive: "0",
    prev_question: PREV_QUESTION,
    timestamp: String(Math.floor(Date.now() / 1000)),
    user_name: USER_NAME,
    user_phone: USER_PHONE,
    timezone: "UTC",
  }).toString();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildBody(),
    });
    if (!res.ok) throw new Error(\`Sociomile HTTP \${res.status}\`);
    const json: any = await res.json();
    if (Array.isArray(json?.messages) && json.messages.length > 0) {
      return json.messages.map((m: any) => m.text).join("\\n");
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, delayMs));
    } else {
      throw new Error("Sociomile tidak memberikan balasan setelah " + retries + " percobaan.");
    }
  }
  throw new Error("Tidak terjangkau");
}

export async function fetchDetailBansosByNik(nik: string): Promise<string> {
  if (!/^\\d{16}$/.test(nik || "")) {
    throw new Error("NIK harus 16 digit angka.");
  }
  const userId = genUserId();
  // Langkah 1: trigger "cek bansos" (bot akan minta NIK)
  await postTalk2bot(userId, TRIGGER);
  // Langkah 2: tunggu 2 detik (sesuai flow manual — beri waktu bot commit state)
  await new Promise((r) => setTimeout(r, 2000));
  // Langkah 3: kirim NIK, terima detail (jawaban terakhir)
  const detail = await postTalk2bot(userId, nik);
  if (/nik.*(salah|tidak valid|tidak ditemukan)|input.*16.*digit.*nik/i.test(detail)) {
    throw new Error("NIK ditolak bot (salah/tidak ditemukan di database Kemensos).");
  }
  return detail;
}
`;

// ---------- 2. server action publik ----------
const ACT_REL = "src/lib/server/actions/cek-bansos-publik.ts";
const ACT_CONTENT = `"use server";

import { rateLimit } from "@/lib/server/utils/rate-limit";
import { getClientIp } from "@/lib/server/utils/client-info";

// Publik (tanpa login) -> rate limit ketat per IP cegah abuse bot Sociomile.
// 5 permintaan / 15 menit per IP (setara rate limit signIn).
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export type CekBansosPublikResult = {
    ok: boolean;
    detail?: string;
    error?: string;
};

/**
 * Cek bantuan + desil publik via chatbot Sociomile (MINSOS).
 * Dipanggil dari popup CekBansosDialog (Beranda publik, tanpa login).
 *
 * Validasi NIK 16 digit + rate-limit per IP. Hasil = jawaban terakhir bot (detail bansos),
 * atau pesan error jelas (NIK salah / layanan offline / terlalu banyak permintaan).
 */
export async function cekBansosPublikAction(nik: string): Promise<CekBansosPublikResult> {
    // Validasi NIK: harus 16 digit angka (defense-in-depth; client juga validasi).
    const trimmed = (nik || "").trim();
    if (!/^\\d{16}$/.test(trimmed)) {
        return { ok: false, error: "NIK harus 16 digit angka." };
    }

    // Rate limit per IP (publik -> cegah spam bot Sociomile).
    const ip = await getClientIp();
    const key = \`cek-bansos-publik:ip:\${ip}\`;
    const check = rateLimit(key, LIMIT, WINDOW_MS);
    if (!check.allowed) {
        const retryMin = Math.max(1, Math.ceil((check as any).retryAfterMs / 60000));
        return { ok: false, error: \`Terlalu banyak permintaan. Coba lagi dalam \${retryMin} menit.\` };
    }

    try {
        const { fetchDetailBansosByNik } = await import("@/lib/server/services/sociomile-bansos");
        const detail = await fetchDetailBansosByNik(trimmed);
        return { ok: true, detail };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // NIK ditolak bot -> pesan jelas ke user.
        if (/nik.*(salah|ditolak|tidak ditemukan)|input.*16.*digit.*nik/i.test(msg)) {
            return { ok: false, error: "NIK tidak ditemukan di database Kemensos. Periksa kembali NIK Anda." };
        }
        // Sociomile gangguan / offline / network.
        if (/HTTP|tidak memberikan balasan|Tidak terjangkau|fetch failed|network/i.test(msg)) {
            return { ok: false, error: "Layanan cek bansos sedang tidak tersedia (bot offline / gangguan jaringan). Coba lagi nanti." };
        }
        return { ok: false, error: "Gagal memeriksa bansos. Silakan coba lagi." };
    }
}
`;

// ---------- 3. dialog component ----------
const DIALOG_REL = "src/components/cek-bansos-dialog.tsx";
const DIALOG_CONTENT = `"use client";

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
    if (!/^\\d{16}$/.test(trimmed)) {
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
                onChange={(e) => setNik(e.target.value.replace(/\\D/g, ""))}
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
`;

// ---------- 4. patch layanan-dropdown.tsx (ubah href menu) ----------
const DROPDOWN_REL = "src/components/layanan-dropdown.tsx";
const DROPDOWN_FIND = `  {
    label: "Cek Bantuan dan Desil",
    href: "https://cekbansos.kemensos.go.id",
    icon: HandCoins,
    newTab: false,
  },`;
const DROPDOWN_REPLACE = `  {
    label: "Cek Bantuan dan Desil",
    // Buka popup CekBansosDialog (hash #cek-bansos) alih-alih navigasi ke situs Kemensos.
    href: "/#cek-bansos",
    icon: HandCoins,
    newTab: false,
  },`;

// ---------- 5. patch public layout.tsx (import + render dialog) ----------
const LAYOUT_REL = "src/app/(public)/layout.tsx";
const LAYOUT_IMPORT_FIND = `import { LayananDropdown } from "@/components/layanan-dropdown";`;
const LAYOUT_IMPORT_REPLACE = `import { LayananDropdown } from "@/components/layanan-dropdown";
import { CekBansosDialog } from "@/components/cek-bansos-dialog";`;
const LAYOUT_RENDER_FIND = `            </footer>
        </div>
    );
}`;
const LAYOUT_RENDER_REPLACE = `            </footer>

            {/* Popup Cek Bantuan dan Desil (dipicu menu Layanan Masyarakat -> hash #cek-bansos) */}
            <CekBansosDialog />
        </div>
    );
}`;

// ---------- run ----------
log("=== setup-cek-bansos-publik.js — popup Cek Bantuan dan Desil di Beranda ===");
log("Auto-fetch dari chatbot Sociomile (MINSOS), popup NIK, tanpa login.\n");

let changed = [];

// 1. service module
const svcExisting = readRel(SVC_REL);
if (svcExisting && svcExisting.includes("fetchDetailBansosByNik")) {
  skip("1. " + SVC_REL);
} else {
  writeRel(SVC_REL, SVC_CONTENT, readRel(DROPDOWN_REL) || "");
  ok("1. buat " + SVC_REL);
  changed.push(SVC_REL);
}

// 2. server action publik
const actExisting = readRel(ACT_REL);
if (actExisting && actExisting.includes("cekBansosPublikAction")) {
  skip("2. " + ACT_REL);
} else {
  writeRel(ACT_REL, ACT_CONTENT, readRel(DROPDOWN_REL) || "");
  ok("2. buat " + ACT_REL);
  changed.push(ACT_REL);
}

// 3. dialog component
const dlgExisting = readRel(DIALOG_REL);
if (dlgExisting && dlgExisting.includes("CekBansosDialog")) {
  skip("3. " + DIALOG_REL);
} else {
  writeRel(DIALOG_REL, DIALOG_CONTENT, readRel(DROPDOWN_REL) || "");
  ok("3. buat " + DIALOG_REL);
  changed.push(DIALOG_REL);
}

// 4. patch layanan-dropdown.tsx (ubah href menu -> /#cek-bansos)
if (patchFile(DROPDOWN_REL, "4. layanan-dropdown.tsx — href menu -> /#cek-bansos",
  DROPDOWN_FIND, DROPDOWN_REPLACE, 'href: "/#cek-bansos"')) {
  changed.push(DROPDOWN_REL);
}

// 5a. patch layout.tsx (import)
patchFile(LAYOUT_REL, "5a. layout.tsx — import CekBansosDialog",
  LAYOUT_IMPORT_FIND, LAYOUT_IMPORT_REPLACE, 'import { CekBansosDialog }');

// 5b. patch layout.tsx (render)
// Marker "Popup Cek Bantuan dan Desil" = teks komentar di blok render (HANYA ada di render,
// bukan di import) -> tidak keliru skip karena import 5a juga mengandung "CekBansosDialog".
if (patchFile(LAYOUT_REL, "5b. layout.tsx — render <CekBansosDialog/>",
  LAYOUT_RENDER_FIND, LAYOUT_RENDER_REPLACE, "Popup Cek Bantuan dan Desil")) {
  changed.push(LAYOUT_REL);
}

if (changed.length === 0) {
  log("\nSemua sudah terpasang. Tidak ada perubahan.");
  process.exit(0);
}

// 6. git add + commit + push
log("\nGit push...");
try {
  const { execFileSync } = require("child_process");
  for (const rel of changed) {
    execFileSync("git", ["add", rel], { stdio: "ignore", cwd: ROOT });
  }
  execFileSync("git", ["commit", "-m", "feat: popup Cek Bantuan dan Desil di Beranda publik via Sociomile (MINSOS)"], { stdio: "ignore", cwd: ROOT });
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
  execFileSync("git", ["push", "origin", branch], { stdio: "ignore", cwd: ROOT });
  log("v  Push branch: " + branch);
} catch (e) {
  console.error("x  Git gagal: " + (e.message || e));
  console.error("   Manual: git add " + changed.join(" ") + " && git commit -m 'feat: popup cek bansos publik' && git push");
  process.exit(1);
}

log("\nv  SELESAI. Vercel akan auto-redeploy.");
log("   Setelah deploy: user (publik, tanpa login) klik menu 'Cek Bantuan dan Desil'");
log("   -> popup minta NIK -> program panggil Sociomile -> jawaban tampil di popup.");
log("   Desktop + mobile menu keduanya jalan (sama-sama pakai href /#cek-bansos).");
log("   Catatan: bot MINSOS aktif 10:00-17:00 (OFF weekend). Rate limit 5x/15 menit/IP.");
