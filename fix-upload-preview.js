#!/usr/bin/env node
/**
 * fix-upload-preview.js — perbaiki bug "gambar/dokumen upload berhasil tapi tidak tampil".
 *
 * ROOT CAUSE:
 *   src/lib/server/services/upload.ts → uploadFile() pakai Vercel Blob `access: "private"`.
 *   URL private TIDAK bisa di-load browser (401/403) → <img src={url}> broken → preview
 *   tidak tampil, meski toast "berhasil diunggah" muncul (karena res.url truthy).
 *
 *   Bandingkan: uploadFotoCekBansosAction + uploadGambarBeritaAction pakai `access: "public"`
 *   → preview jalan. uploadFile (dipakai semua form permohonan via FileUploadField +
 *   uploadDocumentAction) satu-satunya yang "private" → outlier + bug.
 *
 * FIX:
 *   Ubah `access: "private"` → `access: "public"` di services/upload.ts.
 *   URL Vercel Blob public bisa langsung di-load di <img> → preview tampil.
 *
 * Yang di-patch: 1 file (src/lib/server/services/upload.ts). Lalu git push → Vercel redeploy.
 * Idempoten + CRLF-aware (Windows). Jalankan di root project.
 *
 * Catatan privasi: dokumen (scan KTP/KK/akta) jadi public-readable (URL UUID, sulit ditebak).
 * Ini konsisten dgn konvensi app lainnya (foto KK cek-bansos juga public). Kalau butuh
 * privatitas ketat, perlu proxy route /api/file/[id] yang baca blob pakai token server-side.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const log = (m) => console.log(m);
const ok = (m) => console.log("  v " + m);
const skip = (m) => console.log("  [sudah] " + m);

const REL = "src/lib/server/services/upload.ts";
const FIND = `      access: "private",
      contentType: file.type || "application/pdf",`;
const REPLACE = `      // "public" wajib agar URL bisa di-load di <img> preview + tampil di detail.
      // "private" -> URL 401/403 saat browser fetch -> gambar tidak tampil meski upload sukses.
      // Konsisten dgn uploadFotoCekBansosAction/uploadGambarBeritaAction.
      access: "public",
      contentType: file.type || "application/pdf",`;
const MARKER = `"public" wajib agar URL bisa di-load`;

log("=== fix-upload-preview.js — gambar/dokumen tidak tampil setelah upload ===");
log("Root cause: Vercel Blob access:\"private\" → URL tidak bisa di-load <img>\n");

const full = path.join(ROOT, REL);
if (!fs.existsSync(full)) {
  console.error("  x file tidak ada: " + REL);
  console.error("    Pastikan dijalankan dari root project (ada folder src/).");
  process.exit(1);
}

let raw = fs.readFileSync(full, "utf8");
const hadCRLF = raw.includes("\r\n");
const content = hadCRLF ? raw.replace(/\r\n/g, "\n") : raw;

if (content.includes(MARKER)) {
  skip(REL + " — sudah access:\"public\"");
  process.exit(0);
}

// Cek apakah file sudah pakai "public" tapi tanpa marker (versi lain) — jangan double-patch.
if (!content.includes('access: "private"') && content.includes('access: "public"')) {
  skip(REL + ' — sudah access:"public" (versi lain)');
  process.exit(0);
}

if (!content.includes(FIND)) {
  console.error("  x [SKIP] anchor tidak ketemu. Cek isi services/upload.ts:");
  console.error('    cari: access: "private" + contentType: file.type || "application/pdf"');
  console.error("    Kalau format beda, edit manual: ubah access \"private\" -> \"public\".");
  process.exit(1);
}

let next = content.replace(FIND, REPLACE);
if (hadCRLF) next = next.replace(/\n/g, "\r\n");
fs.writeFileSync(full, next);
ok(REL + ' — access "private" -> "public"');

// git push
log("\nGit push...");
try {
  const { execFileSync } = require("child_process");
  execFileSync("git", ["add", REL], { stdio: "ignore", cwd: ROOT });
  execFileSync("git", ["commit", "-m", "fix: upload preview tidak tampil — Vercel Blob access private->public"], { stdio: "ignore", cwd: ROOT });
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
  execFileSync("git", ["push", "origin", branch], { stdio: "ignore", cwd: ROOT });
  log("v  Push branch: " + branch);
} catch (e) {
  console.error("x  Git gagal: " + (e.message || e));
  console.error('   Manual: git add ' + REL + " && git commit -m 'fix: upload preview private->public' && git push");
  process.exit(1);
}

log("\nv  SELESAI. Vercel akan auto-redeploy.");
log("   Setelah deploy: upload gambar/dokumen di form pengajuan -> preview langsung tampil.");
log("   File LAMA yang sudah ter-upload private tetap tidak tampil (URL private).");
log("   Untuk file lama: user re-upload, atau jalankan migrasi re-upload manual.");
