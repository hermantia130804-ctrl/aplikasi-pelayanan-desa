#!/usr/bin/env node
/**
 * fix-upload-gagal.js — perbaiki "Gagal mengunggah dokumen" saat pilih file / ambil kamera.
 *
 * ROOT CAUSE:
 *   src/lib/server/services/upload.ts → uploadFile() TIDAK pass `token` ke Vercel Blob put().
 *   Andalkan env standar BLOB_READ_WRITE_TOKEN. Padahal 7 action lain (cek-bansos, berita,
 *   profil, kk, struktur, upload-document, permohonan-delete) eksplisit pakai env
 *   BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN (nama non-standar). Kalau di Vercel hanya nama
 *   non-standar itu yg ter-set, put() throw "No token found" → toast "Gagal mengunggah dokumen".
 *
 *   FileUploadField (semua form permohonan) → uploadDocumentAction (actions/upload.ts)
 *   → uploadFile (services/upload.ts, NO token) ← sumber kegagalan.
 *
 * FIX (2 file):
 *   1. services/upload.ts: tambah token: BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN + hapus cast `as never`
 *      (sejajarkan dgn 7 action lain). + pertahankan pesan error asli di throw.
 *   2. actions/upload.ts: permukaan error.message di catch supaya toast tampilkan penyebab
 *      asli (mis. "No token found") — berguna untuk diagnosa kalau masih gagal.
 *
 * Asumsi: state repo = commit fa9950e (access sudah "public" dari installer fix-upload-preview).
 * Installer ini juga handle state original (access "private") untuk robustness.
 *
 * Idempoten + CRLF-aware. Jalankan di root project.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const log = (m) => console.log(m);
const ok = (m) => console.log("  v " + m);
const skip = (m) => console.log("  [sudah] " + m);

const SVC = "src/lib/server/services/upload.ts";
const ACT = "src/lib/server/actions/upload.ts";

// { file, desc, marker, find, replace }
const PATCHES = [
  {
    file: SVC,
    desc: 'access "private" -> "public" (jika masih private)',
    marker: 'access: "private"',
    find: '      access: "private",',
    replace: '      access: "public",',
    // marker di sini = "belum di-fix" → jika marker ADA, apply; jika tidak, skip
    mode: "if-present",
  },
  {
    file: SVC,
    desc: "tambah token eksplisit + hapus cast as never",
    marker: "token: process.env.BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN",
    find: '      contentType: file.type || "application/pdf",\n    } as never);',
    replace:
      '      contentType: file.type || "application/pdf",\n      // Token WAJIB eksplisit — jangan andalkan env standar BLOB_READ_WRITE_TOKEN.\n      // 7 action lain pakai BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN; tanpa token -> put() throw\n      // "No token found" -> toast "Gagal mengunggah dokumen".\n      token: process.env.BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN,\n    });',
    mode: "if-absent",
  },
  {
    file: SVC,
    desc: "pertahankan pesan error asli di throw (diagnosa)",
    marker: 'throw new Error("Gagal mengunggah dokumen: "',
    find: '    throw new Error("Gagal mengunggah dokumen");',
    replace:
      '    // Pertahankan pesan error asli (mis. "No token found") supaya tampak di toast diagnosa.\n    const detail = error instanceof Error ? error.message : String(error);\n    throw new Error("Gagal mengunggah dokumen: " + detail);',
    mode: "if-absent",
  },
  {
    file: ACT,
    desc: "permukaan error.message di catch (toast tampilkan penyebab asli)",
    marker: 'error instanceof Error ? error.message : "Gagal mengunggah dokumen"',
    find: '    return { error: "Gagal mengunggah dokumen" };',
    replace:
      '    // Permukaan pesan error asli (dari uploadFile/put) supaya diagnosa tampak di toast.\n    return { error: error instanceof Error ? error.message : "Gagal mengunggah dokumen" };',
    mode: "if-absent",
  },
];

log("=== fix-upload-gagal.js — Gagal mengunggah dokumen (file/kamera) ===");
log("Root cause: uploadFile() tidak pass token Vercel Blob → put() throw\n");

const touched = new Set();

for (const p of PATCHES) {
  const full = path.join(ROOT, p.file);
  if (!fs.existsSync(full)) {
    console.error("  x file tidak ada: " + p.file);
    process.exit(1);
  }
  let raw = fs.readFileSync(full, "utf8");
  const hadCRLF = raw.includes("\r\n");
  const content = hadCRLF ? raw.replace(/\r\n/g, "\n") : raw;

  const markerPresent = content.includes(p.marker);

  if (p.mode === "if-absent") {
    // sudah di-fix jika marker SUDAH ada
    if (markerPresent) {
      skip(p.file + " — " + p.desc);
      continue;
    }
    if (!content.includes(p.find)) {
      console.error("  x [SKIP] anchor tidak ketemu di " + p.file + " (" + p.desc + ")");
      console.error("    cari: " + p.find.split("\n")[0].trim());
      process.exit(1);
    }
    let next = content.replace(p.find, p.replace);
    if (hadCRLF) next = next.replace(/\n/g, "\r\n");
    fs.writeFileSync(full, next);
    ok(p.file + " — " + p.desc);
    touched.add(p.file);
  } else if (p.mode === "if-present") {
    // apply HANYA jika marker (kondisi belum di-fix) ada
    if (!markerPresent) {
      skip(p.file + " — " + p.desc + " (sudah public)");
      continue;
    }
    if (!content.includes(p.find)) {
      skip(p.file + " — " + p.desc + " (marker ada tapi anchor beda, lewati)");
      continue;
    }
    let next = content.replace(p.find, p.replace);
    if (hadCRLF) next = next.replace(/\n/g, "\r\n");
    fs.writeFileSync(full, next);
    ok(p.file + " — " + p.desc);
    touched.add(p.file);
  }
}

if (touched.size === 0) {
  log("\n[sudah] Semua patch sudah terapply. Tidak ada perubahan.");
  process.exit(0);
}

// git push
log("\nGit push...");
try {
  const { execFileSync } = require("child_process");
  for (const f of touched) execFileSync("git", ["add", f], { stdio: "ignore", cwd: ROOT });
  execFileSync("git", ["commit", "-m", "fix: gagal mengunggah dokumen — tambah token Blob eksplisit + permukaan error"], { stdio: "ignore", cwd: ROOT });
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
  execFileSync("git", ["push", "origin", branch], { stdio: "ignore", cwd: ROOT });
  log("v  Push branch: " + branch);
} catch (e) {
  console.error("x  Git gagal: " + (e.message || e));
  console.error("   Manual: git add -A && git commit -m 'fix: upload gagal - token blob' && git push");
  process.exit(1);
}

log("\nv  SELESAI. Vercel akan auto-redeploy.");
log("   Setelah deploy: upload file/kamera di form pengajuan → harus sukses + preview tampil.");
log("");
log("   PENGECEKAN ENV (penting):");
log("   Buka Vercel dashboard → project → Settings → Environment Variables.");
log("   Pastikan BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN ada + berisi token Blob store Anda.");
log("   (Nama ini yg dipakai 7 action lain yg jalan — cek-bansos, berita, profil, dll.)");
log("   Kalau TIDAK ada, tambahkan: name=BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN, value=<token Blob>,");
log("   lalu Redeploy. Token Blob ada di Vercel → Storage → Blob store → copy token.");
log("");
log("   Kalau masih gagal setelah fix ini, toast sekarang akan tampilkan pesan error ASLI");
log("   (mis. 'No token found' / 'Access denied') — kirim ke saya untuk diagnosa lanjut.");
