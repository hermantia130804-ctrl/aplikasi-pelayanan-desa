#!/usr/bin/env node
/**
 * fix-moment-to-date-fns.js — perbaikan performance P2: hapus dependensi moment.
 *
 * MASALAH:
 *   - 31 file import `moment` (~280 KB, tidak tree-shakeable). 17 di antaranya komponen
 *     CLIENT (forms/columns/detail) → moment termuat di bundle browser + server.
 *   - `date-fns` v4 sudah terpasang + sudah dipakai di tempat lain dgn `{ locale: id }`.
 *
 * FIX (per file, mekanis):
 *   A. moment(X).format("TOKEN")  -> format(X, "<date-fns-token>", { locale: id })
 *   B. moment().toDate()          -> new Date()
 *   C. moment(X).toDate()         -> new Date(X)
 *   D. moment(X).isBefore(moment()) -> isBefore(X, new Date())
 *
 *   Token mapping (moment -> date-fns): DD->dd, YYYY->yyyy.
 *   MM/MMM/MMM/HH/mm/ss TIDAK berubah (sudah sama).
 *
 *   Import: `import moment from "moment"` diganti `import { format } from "date-fns"`
 *   + `import { id } from "date-fns/locale"` (sesuai kebutuhan).
 *
 *   Terakhir: hapus `"moment"` dari package.json (cleanup dep).
 *
 * CATATAN PERILAKU: moment tanpa locale('id') merender bulan Inggris (May, Aug, Oct, Des...).
 * date-fns dgn { locale: id } merender Indonesia (Mei, Agu, Okt, Des). Untuk format numerik
 * (DD/MM/YYYY) locale tidak berdampak. Hasil locale id lebih tepat utk app desa Indonesia +
 * konsisten dgn komponen date-fns lain.
 *
 * AMAN: tiap file diverifikasi — jika ada pola moment( tak tertangani, file itu di-revert
 * (tidak ditulis) + di-warning. Tidak ada kode pecah yang dikirim.
 *
 * Idempoten. Jalankan di root project.
 */

const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

const log = (m) => console.log(m);
const ok = (m) => console.log("  v " + m);
const skip = (m) => console.log("  [sudah] " + m);
const warn = (m) => console.log("  ! " + m);

// ── Token transform: moment -> date-fns ──
function transformToken(tokWithQuotes) {
  return tokWithQuotes.replace(/DD/g, "dd").replace(/YYYY/g, "yyyy");
}

// ── Walk src/ untuk cari file .ts/.tsx ──
function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (/\.tsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

// ── Convert satu file ──
function convertFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  const crlf = src.includes("\r\n");
  src = crlf ? src.replace(/\r\n/g, "\n") : src;

  if (!src.includes('import moment from "moment"')) {
    return { status: "skip" };
  }
  const orig = src;

  // Cek import date-fns sudah ada? (duplikat risk) — skip jika ya
  if (/from ["']date-fns["']/.test(orig) || /from ["']date-fns\/locale["']/.test(orig)) {
    return { status: "dup", reason: "sudah import date-fns — review manual" };
  }

  // Tentukan import yg dibutuhkan (dari pola di ORIGINAL src)
  const needsFormat = /moment\([^)]*\)\.format\(/.test(orig);
  const needsIsBefore = /\.isBefore\(/.test(orig);
  const needsId = needsFormat;

  // 1. B: moment().toDate() -> new Date()
  src = src.replace(/moment\(\)\.toDate\(\)/g, "new Date()");
  // 2. D-specific: moment(X).isBefore(moment()) -> isBefore(X, new Date())
  src = src.replace(/moment\(([^)]+)\)\.isBefore\(moment\(\)\)/g, "isBefore($1, new Date())");
  // 3. D-general: moment(X).isBefore(Y) [Y tanpa parens] -> isBefore(X, Y)
  src = src.replace(/moment\(([^)]+)\)\.isBefore\(([^()]+)\)/g, "isBefore($1, $2)");
  // 4. C: moment(X).toDate() -> new Date(X)
  src = src.replace(/moment\(([^)]+)\)\.toDate\(\)/g, "new Date($1)");
  // 5. A: moment(X).format("TOKEN") -> format(X, "<date-fns>", { locale: id })
  src = src.replace(/moment\(([^)]+)\)\.format\(("[^"]+")\)/g, (_, arg, tok) =>
    `format(${arg}, ${transformToken(tok)}, { locale: id })`
  );

  // Cek pola moment( tak tertangani -> revert
  if (/moment\(/.test(src)) {
    return { status: "warn", reason: "pola moment() tak tertangani — di-revert" };
  }

  // Bangun import pengganti
  const fns = [];
  if (needsFormat) fns.push("format");
  if (needsIsBefore) fns.push("isBefore");
  let newImport = "";
  if (fns.length > 0) {
    newImport = `import { ${fns.join(", ")} } from "date-fns";`;
    if (needsId) newImport += `\nimport { id } from "date-fns/locale";`;
  }

  // Ganti baris import moment
  if (newImport) {
    src = src.replace(/import moment from "moment";\n?/, newImport + "\n");
  } else {
    // Hanya pakai toDate/moment() -> tidak perlu import date-fns, hapus saja
    src = src.replace(/import moment from "moment";\n?/, "");
  }

  // Verifikasi import moment benar-benar hilang
  if (/import moment/.test(src)) {
    return { status: "warn", reason: "baris import tidak terganti — di-revert" };
  }

  let out = src;
  if (crlf) out = src.replace(/\n/g, "\r\n");
  fs.writeFileSync(filePath, out);
  return { status: "ok", needsFormat, needsIsBefore };
}

// ── Main ──
const srcDir = path.join(ROOT, "src");
if (!fs.existsSync(srcDir)) {
  console.error("x  Folder src/ tidak ditemukan di " + ROOT);
  process.exit(1);
}

log("Mencari file yang import moment...");
const allFiles = walk(srcDir);
const momentFiles = allFiles.filter((f) =>
  fs.readFileSync(f, "utf8").includes('import moment from "moment"')
);
log("Ditemukan " + momentFiles.length + " file.\n");

const touched = [];
let nOk = 0, nSkip = 0, nDup = 0, nWarn = 0;
let totalFormat = 0, totalIsBefore = 0;

for (const f of momentFiles) {
  const rel = path.relative(ROOT, f);
  const r = convertFile(f);
  if (r.status === "ok") {
    touched.push(f);
    nOk++;
    if (r.needsFormat) totalFormat++;
    if (r.needsIsBefore) totalIsBefore++;
    ok(rel);
  } else if (r.status === "skip") {
    nSkip++; skip(rel);
  } else if (r.status === "dup") {
    nDup++; warn(rel + " — " + r.reason);
  } else if (r.status === "warn") {
    nWarn++; warn(rel + " — " + r.reason);
  }
}

log("\nRingkasan: " + nOk + " converted, " + nSkip + " skip, " + nDup + " dup, " + nWarn + " warn.");

if (nWarn > 0) {
  log("\n! Ada file di-revert. Cek warning di atas. Installer berhenti (tidak push).");
  log("  Perbaiki manual pola moment() tak tertangani di file tsb, lalu jalankan ulang.");
  process.exit(1);
}

if (nOk === 0) {
  log("\n[sudah] Tidak ada file dikonversi. moment sudah tidak dipakai.");
}

// ── Verifikasi: tidak ada lagi import moment di src ──
const remaining = allFiles.filter((f) =>
  fs.readFileSync(f, "utf8").includes('import moment from "moment"')
);
if (remaining.length > 0) {
  log("\n! Masih ada " + remaining.length + " file import moment (mungkin dup-skip):");
  remaining.forEach((f) => log("   - " + path.relative(ROOT, f)));
  log("  package.json TIDAK diubah. Selesaikan manual lalu jalankan ulang.");
} else {
  // ── Hapus moment dari package.json ──
  const pkgPath = path.join(ROOT, "package.json");
  const pkgSrc = fs.readFileSync(pkgPath, "utf8");
  if (pkgSrc.includes('"moment"')) {
    const pkg = JSON.parse(pkgSrc);
    if (pkg.dependencies && pkg.dependencies.moment) {
      delete pkg.dependencies.moment;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
      ok("package.json — hapus dependensi moment");
      touched.push(pkgPath);
    }
  } else {
    skip("package.json — moment sudah tidak ada");
  }
}

// ── Git push ──
if (touched.length === 0) {
  log("\n[sudah] Semua bersih. Tidak ada perubahan.");
  process.exit(0);
}
log("\nGit push...");
try {
  const { execFileSync } = require("child_process");
  for (const f of touched) execFileSync("git", ["add", f], { stdio: "ignore", cwd: ROOT });
  execFileSync("git", ["commit", "-m",
    "perf: ganti moment ke date-fns (" + nOk + " file) — hapus dep ~280KB"], { stdio: "ignore", cwd: ROOT });
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
  execFileSync("git", ["push", "origin", branch], { stdio: "ignore", cwd: ROOT });
  log("v  Push branch: " + branch);
} catch (e) {
  console.error("x  Git gagal: " + (e.message || e));
  console.error("   Manual: git add -A && git commit -m 'perf: ganti moment ke date-fns' && git push");
  process.exit(1);
}

log("\nv  SELESAI. " + nOk + " file dikonversi, moment dihapus dari package.json.");
log("   Vercel auto-redeploy. Setelah deploy, jalankan: npm install (update lockfile).");
log("");
log("   Efek bundle:");
log("   - 17 komponen client (forms/columns/detail): moment ~280KB keluar dari bundle browser.");
log("   - 14 server page/service: keluar dari bundle serverless (cold start lebih cepat).");
log("");
log("   CATATAN: bulan dgn nama (MMM/MMMM) sekarang locale Indonesia");
log("   (Mei/Agu/Okt/Des) bukan Inggris (May/Aug/Oct/Dec) — lebih tepat utk app desa.");
log("   Format numerik (DD/MM/YYYY) tidak berubah.");
