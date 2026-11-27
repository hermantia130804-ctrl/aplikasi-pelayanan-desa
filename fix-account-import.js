#!/usr/bin/env node
/**
 * fix-account-import.js — fix Vercel build error:
 *   Module not found: Can't resolve '@/constants/response-message'
 *   di src/lib/server/actions/account.ts (dan file lain kalau ada).
 *
 * Penyebab:
 *   account.ts: import { RESPONSE_MESSAGE } from "@/constants/response-message";
 *   Tapi file `src/constants/response-message.ts` TIDAK ADA di repo.
 *   Yang ada: `src/constants/message.ts` yang export `MESSAGE` dengan struktur
 *   properti PERSIS SAMA (GLOBAL.UNAUTHORIZED, AUTH.SIGN_IN_OK, AUTH.SIGN_IN_INCORRECT).
 *
 * Fix:
 *   Ganti import jadi: import { MESSAGE as RESPONSE_MESSAGE } from "@/constants/message";
 *   (alias MESSAGE -> RESPONSE_MESSAGE, supaya seluruh isi file lainnya tidak berubah.)
 *
 * Skrip ini scan SEMUA file .ts/.tsx di src/ yang punya import broken, fix semua.
 * Idempoten (skip kalau sudah fix) + CRLF-aware (jalan di Windows) + auto git push.
 *
 * Pakai:  node fix-account-import.js    (di root project, sejajar package.json)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const FIND = 'import { RESPONSE_MESSAGE } from "@/constants/response-message";';
const REPLACE = 'import { MESSAGE as RESPONSE_MESSAGE } from "@/constants/message";';

console.log("=== fix-account-import.js ===");
console.log("Fix: @/constants/response-message -> @/constants/message (alias MESSAGE)\n");

// ---------- recursive walk ----------
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "generated"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
}

const all = [];
walk(path.join(ROOT, "src"), all);

const changed = [];
let alreadyFixed = 0;
let skippedNoMatch = 0;

for (const f of all) {
  const rel = path.relative(ROOT, f).split(path.sep).join("/");
  let raw;
  try { raw = fs.readFileSync(f, "utf8"); } catch { continue; }

  // Hanya proses file yang relevan (punya token response-message atau sudah fix)
  if (!raw.includes("response-message") && !raw.includes(REPLACE)) continue;

  const hadCRLF = raw.includes("\r\n");
  const content = hadCRLF ? raw.replace(/\r\n/g, "\n") : raw;

  if (content.includes(REPLACE)) {
    console.log("  [sudah] " + rel);
    alreadyFixed++;
    continue;
  }
  if (!content.includes(FIND)) {
    console.log("  [lewati] " + rel + " (punya token 'response-message' tapi tidak cocok pattern — cek manual)");
    skippedNoMatch++;
    continue;
  }

  let next = content.replace(FIND, REPLACE);
  if (hadCRLF) next = next.replace(/\n/g, "\r\n");
  fs.writeFileSync(f, next);
  console.log("  [fix] " + rel);
  changed.push(rel);
}

console.log("\nRingkas: " + changed.length + " di-fix, " + alreadyFixed + " sudah benar, " + skippedNoMatch + " lewati.");

if (changed.length === 0) {
  console.log("\nTidak ada perubahan. Build error mungkin penyebab lain — paste error baru kalau ada.");
  process.exit(0);
}

// ---------- git add + commit + push ----------
console.log("\nGit push...");
try {
  for (const rel of changed) execFileSync("git", ["add", rel], { stdio: "ignore", cwd: ROOT });
  execFileSync("git", ["commit", "-m", "fix: import RESPONSE_MESSAGE dari @/constants/message (resolve build error response-message not found)"], { stdio: "ignore", cwd: ROOT });
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
  execFileSync("git", ["push", "origin", branch], { stdio: "ignore", cwd: ROOT });
  console.log("v  Push branch: " + branch);
} catch (e) {
  console.error("x  Git gagal: " + (e.message || e));
  console.error("   Lakukan manual:");
  console.error("   git add " + changed.join(" "));
  console.error('   git commit -m "fix: import RESPONSE_MESSAGE dari @/constants/message"');
  console.error("   git push");
  process.exit(1);
}

console.log("\nv  SELESAI. Vercel akan auto-redeploy.");
console.log("   Build seharusnya lewat error '@/constants/response-message'.");
console.log("   Kalau ada error build baru, paste ke saya — bisa jadi error lain (tertutup error ini tadi).");
