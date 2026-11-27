#!/usr/bin/env node
/**
 * setup-sociomile-auto.js (v2) — otomatisasi detail bansos dari chatbot Sociomile
 * (MINSOS / KemensosKbAI), TANPA TOMBOL. Auto-fetch setiap LOGIN.
 *
 * Protokol DIKONFIRMASI via capture live widget (26 Nov 2026):
 *   POST https://superchat.sociomile.net/talk2bot (form-urlencoded)
 *   Flow: message="cek bansos" -> tunggu 2 detik -> message=<NIK> -> jawaban terakhir = detail.
 *
 * Yang dilakukan skrip ini:
 *   1. BUAT src/lib/server/services/sociomile-bansos.ts   (service fetchDetailBansosByNik, dgn jeda 2s)
 *   2. PATCH src/lib/server/actions/auth.ts                (signInAction: auto-fetch setelah login,
 *      try/catch — login TIDAK pernah gagal karena Sociomile)
 *   3. TULIS ULANG src/components/welcome-bansos-card.tsx   (display-only, TANPA tombol)
 *   4. git add + commit + push  (Vercel auto-redeploy)
 *
 * Hasil: setiap user login -> program otomatis ambil detail bansos pakai NIK user ->
 * simpan ke User.detailBansos -> tampil otomatis di kartu dashboard (tanpa klik apa pun).
 *
 * Idempoten + CRLF-aware (jalan di Windows). Jalankan di root project.
 *
 * Catatan: login jadi ~3-5 detik (waktu panggil Sociomile). Vercel Hobby 10s timeout OK.
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
    console.error("    cari: " + find.slice(0, 80).replace(/\n/g, "\\n"));
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
const SVC_CONTENT = `// Service: ambil detail bansos otomatis dari chatbot Kemensos (MINSOS) via REST Sociomile.
// Protokol dikonfirmasi via capture live widget (26 Nov 2026).
//
// Flow (sesuai flow manual user):
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

// ---------- 2. auth.ts: patch signInAction ----------
const AUTH_REL = "src/lib/server/actions/auth.ts";
const AUTH_FIND = `        await setSessionTokenCookie(session.data.sessionId, session.data.expiresAt);
        return { status: status.OK, message: message.SIGN_IN_OK };`;
const AUTH_REPLACE = `        await setSessionTokenCookie(session.data.sessionId, session.data.expiresAt);

        // ===== AUTO-FETCH DETAIL BANSOS (setiap login, TANPA tombol) =====
        // Panggil chatbot Sociomile (MINSOS) pakai NIK user -> simpan ke User.detailBansos.
        // try/catch: login TIDAK boleh gagal karena Sociomile (bot offline / NIK ditolak /
        // network). Detail tetap null/old kalau gagal -> retry login berikutnya.
        try {
            const { prisma } = await import("@/lib/prisma");
            const u = await prisma.user.findUnique({
                where: { userId: data.userId },
                select: { nik: true },
            });
            if (u?.nik) {
                const { fetchDetailBansosByNik } = await import("../services/sociomile-bansos");
                const detail = await fetchDetailBansosByNik(u.nik);
                await prisma.user.update({
                    where: { userId: data.userId },
                    data: { detailBansos: detail },
                });
            }
        } catch (e) {
            console.error("[AUTO BANSOS] Gagal fetch detail bansos saat login:", e instanceof Error ? e.message : e);
        }

        return { status: status.OK, message: message.SIGN_IN_OK };`;

// ---------- 3. welcome-bansos-card.tsx (display-only, tanpa tombol) ----------
const CARD_REL = "src/components/welcome-bansos-card.tsx";
const CARD_CONTENT = `import { Card, CardContent } from "@/components/ui/card";

interface WelcomeBansosCardProps {
  nama: string;
  nik: string;
  detailBansos?: string | null;
}

// Kartu display-only: detail bansos sudah di-fetch otomatis saat login (signInAction ->
// fetchDetailBansosByNik -> User.detailBansos). Tidak ada tombol — tampil apa adanya.
export function WelcomeBansosCard({ nama, nik, detailBansos }: WelcomeBansosCardProps) {
  return (
    <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white">
      <CardContent className="p-6">
        <p className="text-center text-sm font-medium text-emerald-600 uppercase tracking-wide">
          Selamat Datang
        </p>
        <h2 className="text-center text-2xl font-bold text-gray-900 mt-1">{nama}</h2>
        <p className="text-center text-sm text-muted-foreground mt-1">NIK: {nik}</p>

        <div className="mt-4 border-t border-emerald-100 pt-4">
          <p className="text-center text-sm font-semibold text-gray-700 mb-2">Detail Bansos</p>
          {detailBansos ? (
            <div className="whitespace-pre-line text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-w-md mx-auto">
              {detailBansos}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">
              Detail bansos akan diambil otomatis dari Kemensos (MINSOS) saat Anda masuk.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
`;

// ---------- run ----------
log("=== setup-sociomile-auto.js (v2 — auto saat login, tanpa tombol) ===");
log("Otomatisasi detail bansos dari chatbot Sociomile (MINSOS)\n");

let changed = [];

// 1. service module
const svcExisting = readRel(SVC_REL);
if (svcExisting && svcExisting.includes("fetchDetailBansosByNik")) {
  skip("1. " + SVC_REL);
} else {
  const ref = readRel(AUTH_REL) || "";
  writeRel(SVC_REL, SVC_CONTENT, ref);
  ok("1. buat " + SVC_REL);
  changed.push(SVC_REL);
}

// 2. auth.ts: patch signInAction (auto-fetch setelah login)
const authOk = patchFile(AUTH_REL, "2. auth.ts signInAction — auto-fetch detail bansos",
  AUTH_FIND, AUTH_REPLACE, "AUTO BANSOS");
if (authOk) changed.push(AUTH_REL);

// 3. welcome-bansos-card.tsx (display-only)
const cardExisting = readRel(CARD_REL);
if (cardExisting && cardExisting.includes("akan diambil otomatis dari Kemensos")) {
  skip("3. " + CARD_REL + " (sudah display-only)");
} else {
  writeRel(CARD_REL, CARD_CONTENT, cardExisting || readRel(AUTH_REL) || "");
  ok("3. tulis ulang " + CARD_REL + " (display-only, tanpa tombol)");
  changed.push(CARD_REL);
}

if (changed.length === 0) {
  log("\nSemua sudah terpasang. Tidak ada perubahan.");
  process.exit(0);
}

// 4. git add + commit + push
log("\nGit push...");
try {
  for (const rel of changed) {
    const { execFileSync } = require("child_process");
    execFileSync("git", ["add", rel], { stdio: "ignore", cwd: ROOT });
  }
  const { execFileSync } = require("child_process");
  execFileSync("git", ["commit", "-m", "feat: detail bansos auto-fetch saat login via Sociomile (MINSOS) — tanpa tombol"], { stdio: "ignore", cwd: ROOT });
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
  execFileSync("git", ["push", "origin", branch], { stdio: "ignore", cwd: ROOT });
  log("v  Push branch: " + branch);
} catch (e) {
  console.error("x  Git gagal: " + (e.message || e));
  console.error("   Manual: git add " + changed.join(" ") + " && git commit -m 'feat: sociomile auto login' && git push");
  process.exit(1);
}

log("\nv  SELESAI. Vercel akan auto-redeploy.");
log("   Setelah deploy: user login -> program otomatis ambil detail bansos pakai NIK");
log("   -> tampil di kartu dashboard (tanpa klik apa pun). Login jadi ~3-5 detik.");
log("   Catatan: bot MINSOS aktif 10:00-17:00 (OFF weekend). Kalau gagal, detail tetap");
log("   null/old -> retry login berikutnya (login tidak pernah gagal karena Sociomile).");
