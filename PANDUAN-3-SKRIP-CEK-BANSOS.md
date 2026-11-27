# Panduan: 3 Skrip Fix Cek Bansos

Tiga skrip untuk menyelesaikan masalah fitur **Cek Status Bansos + Login NIK** di aplikasi pelayanan desa. Jalankan dari root project (`aplikasi-pelayanan-desa/`, sejajar `package.json`).

| Skrip | Fungsi | Gejala yang diperbaiki |
|---|---|---|
| `setup-cek-bansos-dan-nik.js` | Installer utama: tulis 12 file + 13 patch + `git push`. Idempoten. | Memasang seluruh fitur Cek Bansos + login NIK. |
| `push-db.js` | Load `DATABASE_URL` dari `.env` lalu jalankan `npx prisma db push`. | `P2021: The table public.cek_bansos does not exist` + `DATABASE_URL not found`. |
| `patch-email-status.js` | Patch targeted 2 hal (label SELESAI + `case BANSOS`) di `permohonan-email-status.ts`. | Patch 9a/9b GAGAL di Windows (CRLF); email notifikasi status BANSOS tidak terkirim. |

---

## Urutan jalankan (untuk kasus Anda sekarang)

Anda sudah pernah run installer versi lama. Fitur sudah ter-deploy tapi tabel DB belum dibuat + patch email 9a/9b belum terpasang. Jalankan berurutan:

```bash
cd /c/Users/herman/Desktop/aplikasi-pelayanan-desa

# 1. Pasang / update file + patch (idempoten — yang sudah ada di-skip).
#    Versi terbaru ini sudah fix token upload + CRLF untuk 9a/9b.
node setup-cek-bansos-dan-nik.js

# 2. Buat file .env berisi DATABASE_URL Neon Anda (LIHAT PANDUAN .env DI BAWAH).
#    Lalu jalankan push-db.js (bukan `npx prisma db push` langsung):
node push-db.js

# 3. (Cadangan) Kalau setelah langkah 1 patch 9a/9b masih belum terpasang
#    (cek: `grep case..BANSOS src/lib/server/services/permohonan-email-status.ts`),
#    jalankan patcher targeted:
node patch-email-status.js
git add src/lib/server/services/permohonan-email-status.ts
git commit -m "fix: daftarkan BANSOS ke email notifikasi status (9a/9b)"
git push
```

Setelah langkah 1 + 2 selesai + Vercel auto-redeploy, buka URL live → menu **Ajukan Cek Status Bansos** → form harus jalan (tidak P2021, upload foto sukses).

---

## Panduan `.env` (untuk `push-db.js`)

`push-db.js` mencari `DATABASE_URL` di file-file ini (urutan): **`.env` → `.env.local` → `sukamaju.env`**.

> **Catatan khusus repo Anda:** file `sukamaju.env` di root repo **sudah berisi `DATABASE_URL`** Neon (host pooler — format benar). Versi `push-db.js` terbaru auto-load file itu sebagai fallback, jadi **Anda bisa langsung jalankan `node push-db.js`** tanpa buat `.env` manual — skrip akan ketemu `sukamaju.env` + pakai URL-nya.

### ⚠️ Peringatan keamanan (PENTING)

File `sukamaju.env` **sudah ter-commit ke repo publik GitHub** Anda (terlihat di root repo). Artinya connection string Neon (termasuk password) **terbuka untuk siapa saja**. Segera setelah `push-db.js` jalan:

1. **Rotasi password Neon** — Neon dashboard → project → Settings → Roles → reset password → dapat connection string baru.
2. **Hapus `sukamaju.env` dari git**:
   ```bash
   git rm sukamaju.env
   git commit -m "chore: hapus file env yang ter-commit (kredensial terbuka)"
   git push
   ```
3. **Pastikan `.gitignore` blokir file env** — tambah baris (kalau belum ada):
   ```
   .env
   .env.local
   sukamaju.env
   *.env
   !.env.example
   ```
4. **Buat `.env` lokal** (tidak ikut commit) dengan connection string hasil rotasi (password baru), lalu pakai itu untuk `push-db.js` selanjutnya.

> Password lama yang terbuka di GitHub **tidak bisa "dihapus"** — siapa pun bisa sudah menyalinnya. Rotasi password adalah satu-satunya cara menutup akses.

### Cara ambil connection string Neon

**Opsi A — dari Vercel (paling cepat):**
1. Vercel dashboard → project Anda → **Settings** → **Environment Variables**.
2. Cari `DATABASE_URL` → **copy value**.
3. Format: `postgresql://USER:PASS@ep-XXXX-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require`.

**Opsi B — dari Neon dashboard:**
1. https://dashboard.neon.tech → project Anda.
2. **Connection Details** → branch `main` → pilih role + database.
3. Copy **"Pooled connection"** (host mengandung `-pooler` — lebih stabil untuk push).

### Buat file `.env`

Buat file bernama persis `.env` (titik di depan, tanpa ekstensi lain) di root project:

```
DATABASE_URL="postgresql://USER:PASS@ep-XXXX-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require"
```

Ganti seluruh nilai setelah `=` dengan string Anda. **Jangan ubah nama variabel `DATABASE_URL`** — `schema.prisma` membaca `env("DATABASE_URL")`.

> `.env` jangan di-commit (sudah di-gitignore). Biarkan lokal saja.

Lalu jalankan `node push-db.js`. Skrip akan: validasi URL → tampilkan host + dbname → jalankan `prisma db push` → tabel `cek_bansos` dibuat di Neon + Prisma Client ter-regen.

---

## Diagnosis: skrip mana yang harus dijalankan?

| Gejala | Penyebab | Skrip |
|---|---|---|
| Upload foto gagal ("Gagal mengunggah foto") | Token blob salah (`BLOB_READ_WRITE_TOKEN` → harus `BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN`) | `setup-cek-bansos-dan-nik.js` (versi baru sudah fix token; re-run) |
| `P2021: table cek_bansos does not exist` | Tabel belum dibuat di Neon (`db push` belum jalan) | `push-db.js` (setelah `.env` dibuat) |
| `Environment variable not found: DATABASE_URL` | `.env` belum ada / `DATABASE_URL` kosong | Buat `.env` (lihat panduan di atas) lalu `push-db.js` |
| Patch `9a` / `9b` GAGAL saat run installer | Windows CRLF break find multi-line | `patch-email-status.js` (standalone, CRLF-aware) |
| Warga tidak terima email saat petugas update status BANSOS | `case "BANSOS"` belum ada di `permohonan-email-status.ts` | `patch-email-status.js` |

---

## Catatan teknis

- **Token blob**: fitur Cek Bansos simpan foto di Vercel Blob **public** (pakai `BLOB_PUBLIC_BLOB_READ_WRITE_TOKEN`, sama seperti foto berita/struktur/profil) — supaya pratinjau tampil langsung. Bukan `BLOB_READ_WRITE_TOKEN` (itu untuk blob *private* seperti perbaikan-desil).
- **CRLF (Windows)**: git `core.autocrlf=true` men-checkout file teks dengan line ending CRLF. Find string multi-line (LF) tidak cocok → patch GAGAL. `patchFile` di installer + `patch-email-status.js` normalisasi CRLF→LF sebelum match, lalu restore CRLF (git diff minimal).
- **Idempoten**: ketiga skrip aman dijalankan ulang. Yang sudah terpasang di-skip; hanya yang berubah yang ditulis / di-commit.
- **Login NIK**: setelah installer, form login menerima email **atau** NIK 16 digit. Akun RT/warga yang punya NIK bisa login pakai NIK. Verifikasi pendaftaran + pengangkatan admin tetap seperti biasa.

## File

- [setup-cek-bansos-dan-nik.js](setup-cek-bansos-dan-nik.js) — installer utama.
- [push-db.js](push-db.js) — fix tabel DB / DATABASE_URL.
- [patch-email-status.js](patch-email-status.js) — fix email notifikasi BANSOS (9a/9b).
- [MIGRASI-CEK-BANSOS-DAN-NIK.md](MIGRASI-CEK-BANSOS-DAN-NIK.md) — detail fitur + alur + verifikasi per role.
