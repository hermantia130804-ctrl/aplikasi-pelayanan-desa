#!/usr/bin/env node
/**
 * push-db.js — jalankan `prisma db push` dengan DATABASE_URL yang di-load EKSPLISIT dari .env.
 *
 * Fix:
 *  - "Environment variable not found: DATABASE_URL" (Prisma P1012)
 *  - "The table public.cek_bansos does not exist" (Prisma P2021) — tabel belum dibuat di Neon.
 *
 * Kenapa perlu skrip ini (bukan `npx prisma db push` langsung):
 *  Repo ini .env di-gitignore, jadi Prisma CLI sering tidak menemukan DATABASE_URL di PC
 *  lokal. Skrip ini parse .env manual, validasi URL-nya, set ke process.env, LALU spawn
 *  prisma — jadi Prisma pasti membaca URL-nya. Plus pesan error yang jelas kalau .env
 *  belum dibuat / URL kosong / format salah.
 *
 * Pakai:  node push-db.js     (jalankan di root project, sejajar package.json)
 * Idempoten: aman dijalankan ulang.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();

// ---------- 1. Load .env manual (tanpa dependency dotenv) ----------
// Cek .env dulu, lalu .env.local (fallback). Parse key=value, strip quote.
function loadEnvFile(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, "utf8");
  const vars = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[m[1]] = val;
  }
  return vars;
}

console.log("=== push-db.js — prisma db push (DATABASE_URL eksplisit) ===\n");

// Cek .env dulu (standar), lalu .env.local, lalu sukamaju.env (file yang sudah ada di repo Anda).
const ENV_FILES = [".env", ".env.local", "sukamaju.env"];
let envVars = null;
let envFileFound = null;
for (const f of ENV_FILES) {
  const v = loadEnvFile(f);
  if (v) { envVars = v; envFileFound = f; break; }
}
if (!envVars) {
  console.error("x  File env TIDAK ditemukan di: " + ROOT);
  console.error("   Dicari (urutan): " + ENV_FILES.join(", "));
  console.error("");
  console.error("   Buat file .env di root project (sejajar package.json) berisi SATU baris:");
  console.error('');
  console.error('   DATABASE_URL="postgresql://USER:PASS@ep-XXXX-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require"');
  console.error("");
  console.error("   Cara ambil connection string Neon (pilih salah):");
  console.error("   - Vercel: dashboard project -> Settings -> Environment Variables -> DATABASE_URL -> copy value");
  console.error("   - Neon:   dashboard.neon.tech -> project -> Connection Details -> Pooled connection (host ada -pooler)");
  console.error("");
  console.error("   .env jangan di-commit (sudah di-gitignore). Biarkan lokal saja.");
  process.exit(1);
}

const dbUrl = envVars.DATABASE_URL;
if (!dbUrl || !dbUrl.trim()) {
  console.error("x  DATABASE_URL tidak ada / kosong di .env Anda.");
  console.error("   Tambahkan baris ini ke .env:");
  console.error('');
  console.error('   DATABASE_URL="postgresql://USER:PASS@ep-XXXX-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require"');
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
  console.error("x  DATABASE_URL tidak terlihat sebagai URL PostgreSQL yang valid.");
  console.error("   Nilai (40 char pertama): " + dbUrl.slice(0, 40) + "...");
  console.error("   Format yang benar: postgresql://user:pass@host/dbname?sslmode=require");
  process.exit(1);
}

// set ke process.env supaya Prisma (child process) membacanya
process.env.DATABASE_URL = dbUrl;

// host untuk ditampilkan (verifikasi intuitif, tanpa bocorkan password)
const hostMatch = dbUrl.match(/@([^/?]+)/);
const host = hostMatch ? hostMatch[1] : "(tidak terbaca)";
const dbMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
const dbname = dbMatch ? dbMatch[1] : "(tidak terbaca)";

console.log("v  File env ditemukan: " + envFileFound + " — DATABASE_URL valid");
console.log("   host  : " + host);
console.log("   dbname: " + dbname);
console.log("");
console.log("Menjalankan: npx prisma db push");
console.log("(Kalau diminta konfirmasi reset data, jawab sesuai prompt. Untuk pembuatan");
console.log(" tabel cek_bansos pertama kali, tidak ada data yang hilang — tidak akan prompt.)");
console.log("");

// ---------- 2. Spawn prisma db push ----------
// Pakai execSync (string) bukan execFileSync karena `npx` di Windows adalah .cmd
// (execFileSync tidak auto-resolve .cmd -> ENOENT). execSync lewat shell resolve npx.
try {
  execSync("npx prisma db push", {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
} catch (e) {
  console.error("");
  console.error("x  prisma db push gagal. Lihat pesan error Prisma di atas.");
  console.error("");
  console.error("   Penyebab umum:");
  console.error("   - URL salah / expired            -> ambil ulang dari Neon dashboard.");
  console.error("   - IP PC Anda diblokir Neon        -> Neon dashboard -> Settings -> IP Allow, tambahkan IP / buka semua (untuk dev).");
  console.error("   - Branch Neon salah               -> pakai branch 'main' (default).");
  console.error("   - Skema prisma ada error syntax   -> lihat pesan P1012 di atas, perbaiki prisma/schema.prisma.");
  process.exit(1);
}

console.log("");
console.log("v  SELESAI: skema Prisma sudah disinkronkan ke database Neon.");
console.log("   Tabel cek_bansos (+ relasi User.cekBansos) kini ada di DB.");
console.log("   Prisma Client juga sudah ter-regen (file prisma/client/).");
console.log("");
console.log("Langkah berikut:");
console.log("  1. Push ke GitHub (kalau installer belum push) -> Vercel auto-redeploy.");
console.log("  2. Buka URL live Vercel -> menu 'Ajukan Cek Status Bansos' -> form harus jalan (tidak P2021).");
