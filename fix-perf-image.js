#!/usr/bin/env node
/**
 * fix-perf-image.js — perbaikan performance #1: optimasi gambar.
 *
 * MASALAH:
 *   - 21 <img> plain, 0 next/image. Vercel Blob menyimpan foto UKURAN ASLI (1-5MB/foto).
 *   - Halaman list berita render <img src={blobUrl} className="h-40"> → browser unduh
 *     foto 1-5MB cuma untuk thumbnail 160px. 20 berita = 20-100MB bandwidth per load.
 *   - next.config tidak ada images.remotePatterns → next/image tidak bisa optimasi Blob URL.
 *
 * FIX (2 file):
 *   1. next.config.ts: tambah images.remotePatterns untuk *.public.blob.vercel-storage.com
 *      + img.youtube.com + i.ytimg.com (thumbnail youtube).
 *   2. berita-kegiatan/page.tsx: <img> -> <Image fill> dgn sizes (auto WebP/AVIF + resize).
 *
 * DAMPAK: berita list 20 gambar @1-5MB → ~20-100MB turun ke ~200-800KB (WebP resize 160px).
 *
 * Idempoten. Jalankan di root project.
 */

const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
const log = (m) => console.log(m);
const ok = (m) => console.log("  v " + m);
const skip = (m) => console.log("  [sudah] " + m);

const CFG = "next.config.ts";
const BERITA = "src/app/(modules)/berita-kegiatan/page.tsx";
const touched = [];

// --- 1. next.config.ts: tambah images.remotePatterns ---
const cfgPath = path.join(ROOT, CFG);
let cfg = fs.readFileSync(cfgPath, "utf8");
const cfgCRLF = cfg.includes("\r\n");
cfg = cfgCRLF ? cfg.replace(/\r\n/g, "\n") : cfg;

if (cfg.includes("images: {") || cfg.includes("remotePatterns")) {
  skip(CFG + " — images.remotePatterns sudah ada");
} else {
  const find = "  experimental: {\n    serverActions: {\n      bodySizeLimit: \"10mb\",\n    },\n  },\n};";
  const replace =
    "  images: {\n" +
    "    // Izinkan next/image mengoptimasi gambar dari Vercel Blob + thumbnail YouTube.\n" +
    "    // Tanpa ini, <Image src={blobUrl}> error 400 'hostname not configured'.\n" +
    "    remotePatterns: [\n" +
    "      { protocol: \"https\", hostname: \"**.public.blob.vercel-storage.com\" },\n" +
    "      { protocol: \"https\", hostname: \"img.youtube.com\" },\n" +
    "      { protocol: \"https\", hostname: \"i.ytimg.com\" },\n" +
    "    ],\n" +
    "  },\n" +
    "  experimental: {\n" +
    "    serverActions: {\n" +
    "      bodySizeLimit: \"10mb\",\n" +
    "    },\n" +
    "  },\n" +
    "};";
  if (!cfg.includes(find)) {
    console.error("  x [SKIP] anchor next.config tidak ketemu. Cek manual: tambah images.remotePatterns.");
  } else {
    let next = cfg.replace(find, replace);
    if (cfgCRLF) next = next.replace(/\n/g, "\r\n");
    fs.writeFileSync(cfgPath, next);
    ok(CFG + " — tambah images.remotePatterns (Blob + youtube)");
    touched.push(CFG);
  }
}

// --- 2. berita page: <img> -> <Image> ---
const beritaPath = path.join(ROOT, BERITA);
let b = fs.readFileSync(beritaPath, "utf8");
const bCRLF = b.includes("\r\n");
b = bCRLF ? b.replace(/\r\n/g, "\n") : b;
let beritaChanged = false;

// 2a. import Image dari next/image
if (b.includes('import Image from "next/image"')) {
  skip(BERITA + " — import Image sudah ada");
} else {
  const findImport = 'import Link from "next/link";';
  const replaceImport = 'import Link from "next/link";\nimport Image from "next/image";';
  if (!b.includes(findImport)) {
    console.error("  x [SKIP] anchor import Link tidak ketemu di berita page.");
  } else {
    b = b.replace(findImport, replaceImport);
    beritaChanged = true;
    ok(BERITA + " — import Image dari next/image");
  }
}

// 2b. <img src={b.gambarUrl}> -> <div><Image fill></div>
const img1Find = '<img src={b.gambarUrl} alt={b.judul} className="h-40 w-full object-cover" />';
const img1Replace =
  '<div className="relative h-40 w-full"><Image src={b.gambarUrl} alt={b.judul} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" /></div>';
if (b.includes("Image src={b.gambarUrl}")) {
  skip(BERITA + " — <img gambarUrl> sudah jadi <Image>");
} else if (b.includes(img1Find)) {
  b = b.replace(img1Find, img1Replace);
  beritaChanged = true;
  ok(BERITA + " — <img gambarUrl> -> <Image fill> (auto WebP/AVIF)");
} else {
  console.error("  x [SKIP] anchor <img gambarUrl> tidak ketemu (mungkin indent/format beda).");
}

// 2c. <img youtube> -> <div><Image fill></div>
const img2Find = '<img src={`https://img.youtube.com/vi/${b.youtubeId}/hqdefault.jpg`} alt={b.judul} className="h-40 w-full object-cover" />';
const img2Replace =
  '<div className="relative h-40 w-full"><Image src={`https://img.youtube.com/vi/${b.youtubeId}/hqdefault.jpg`} alt={b.judul} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" /></div>';
if (b.includes("Image src={`https://img.youtube.com")) {
  skip(BERITA + " — <img youtube> sudah jadi <Image>");
} else if (b.includes(img2Find)) {
  b = b.replace(img2Find, img2Replace);
  beritaChanged = true;
  ok(BERITA + " — <img youtube> -> <Image fill>");
} else {
  console.error("  x [SKIP] anchor <img youtube> tidak ketemu.");
}

if (beritaChanged) {
  let out = b;
  if (bCRLF) out = b.replace(/\n/g, "\r\n");
  fs.writeFileSync(beritaPath, out);
  touched.push(BERITA);
}

if (touched.length === 0) {
  log("\n[sudah] Semua patch terapply. Tidak ada perubahan.");
  process.exit(0);
}

// git push
log("\nGit push...");
try {
  const { execFileSync } = require("child_process");
  for (const f of touched) execFileSync("git", ["add", f], { stdio: "ignore", cwd: ROOT });
  execFileSync("git", ["commit", "-m", "perf: optimasi gambar berita — next/image + remotePatterns (Blob/youtube)"], { stdio: "ignore", cwd: ROOT });
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
  execFileSync("git", ["push", "origin", branch], { stdio: "ignore", cwd: ROOT });
  log("v  Push branch: " + branch);
} catch (e) {
  console.error("x  Git gagal: " + (e.message || e));
  console.error("   Manual: git add -A && git commit -m 'perf: optimasi gambar' && git push");
  process.exit(1);
}

log("\nv  SELESAI. Vercel auto-redeploy.");
log("   Efek: berita list load gambar WebP resize (~10-50KB) bukan foto asli (1-5MB).");
log("");
log("   Catatan: 20 <img> lain (preview upload, detail view, data-warga) belum dikonversi.");
log("   next/image untuk preview client-side (FileUploadField) tidak perlu — itu object URL lokal.");
log("   Untuk <img> di detail page (foto KK/KTP/dokumen), konversi next/image juga menghemat bandwidth.");
log("   Lihat audit-report.docx untuk rekomendasi lengkap (moment, pagination, caching, dll).");
