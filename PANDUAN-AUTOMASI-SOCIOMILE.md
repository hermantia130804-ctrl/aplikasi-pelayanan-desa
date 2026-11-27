# Panduan: Otomatisasi Detail Bansos dari Chatbot Sociomile (Kemensos / MINSOS)

Anda minta: **setiap login**, program otomatis ambil detail bansos dari chatbot Sociomile (buka link → kirim "cek bansos" → tunggu 2 detik → masukkan NIK → jawaban terakhir = detail), lalu **tampilkan otomatis** di kartu dashboard — **tanpa tombol apa pun**.

**Status: SELESAI dibangun + siap deploy.** Protokol dikonfirmasi via capture live (26 Nov 2026). Auto-fetch di-hook ke `signInAction` (login). Kartu display-only (tanpa tombol). Tinggal jalankan 1 perintah.

---

## 1. Protokol (dikonfirmasi via capture live)

Saya load widget Sociomile pakai browser headless, pasang interceptor XHR, lakukan chat "cek bansos" + NIK, tangkap request/response-nya. Hasil: **bot bukan socket.io** — dipanggil via REST sederhana:

| Aspek | Nilai |
|---|---|
| Endpoint | `POST https://superchat.sociomile.net/talk2bot` |
| Content-Type | `application/x-www-form-urlencoded` |
| Body | `id=6abd3eb90de3aa91408eb350&driver=web&userId=<rand6>_<roomId>&message=<text>&question=&attachment=&interactive=0&prev_question=ask_name&timestamp=<unix>&user_name=herman&user_phone=6285772646402&timezone=UTC` |
| Response | `{status:200, messages:[{type:"text", text:"...", callback_id:"..."}]}` |
| `userId` | `<random6digit>_<roomId>`, disimpan widget di localStorage |

**Flow 2 langkah** (validasi dengan NIK dummy 16 nol → bot balas "NIK salah", persis capture):
1. `message=cek bansos` → bot: *"Untuk mengetahui status desil Anda, silakan input 16 digit NIK Anda:"*
2. tunggu 2 detik
3. `message=<NIK>` → bot: detail bansos (jawaban terakhir = yang ditampilkan). Atau "NIK salah" kalau invalid.

**Implikasi:** Tidak ada socket.io, tidak ada masalah Vercel timeout (2 HTTP request + 2s jeda = ~3-6s, pas di Hobby 10s).

---

## 2. Yang sudah dibangun (v2 — tanpa tombol)

### a. Prototype CLI (validasi lokal) — `sociomile-bansos-client.js`
Node script, global `fetch` (Node ≥18), tanpa dependency. Flow sama persis: kirim "cek bansos" → tunggu 2 detik → kirim NIK → ambil jawaban terakhir. Dengan retry+delay kalau bot butuh waktu commit state.

**Sudah divalidasi** dengan NIK dummy → bot balas "NIK salah" (sesuai capture). Untuk NIK asli, Anda tes sendiri.

```bash
node sociomile-bansos-client.js 3201234567890001   # NIK asli
```

### b. Integrasi Next.js — `setup-sociomile-auto.js` (installer)
Yang dilakukan installer:

1. **Buat** `src/lib/server/services/sociomile-bansos.ts` — service `fetchDetailBansosByNik(nik): Promise<string>`:
   - POST "cek bansos" → tunggu 2 detik → POST NIK → return jawaban terakhir (detail).
   - Throw kalau NIK ditolak bot (salah/tidak ditemukan).

2. **Patch** `src/lib/server/actions/auth.ts` — di `signInAction`, setelah session dibuat + cookie diset, tambah blok auto-fetch:
   - Ambil NIK user dari DB (pakai `data.userId` dari login).
   - Panggil `fetchDetailBansosByNik(nik)`.
   - Tulis hasil ke `User.detailBansos`.
   - **Dibungkus try/catch** → login TIDAK pernah gagal karena Sociomile (bot offline/NIK ditolak/network). Detail tetap null/old kalau gagal → retry login berikutnya.

3. **Tulis ulang** `src/components/welcome-bansos-card.tsx` — **display-only** (tanpa tombol, tanpa "use client"):
   - Kalau `detailBansos` ada → tampilkan teksnya.
   - Kalau kosong → "Detail bansos akan diambil otomatis dari Kemensos (MINSOS) saat Anda masuk."

4. **git add + commit + push** → Vercel auto-redeploy.

Installer CRLF-aware (Windows) + idempoten (re-run aman). **Sudah dites** di clone repo Anda — semua patch apply bersih.

---

## 3. Cara deploy (1 perintah)

```bash
cd /c/Users/herman/Desktop/aplikasi-pelayanan-desa
node setup-sociomile-auto.js
```

Skrip: tulis 3 file → `git add` + `commit` + `push origin main` → Vercel auto-redeploy.

**Setelah deploy:** user login (pakai email atau NIK) → `signInAction` jalan → credential dicek → session dibuat → **program otomatis panggil Sociomile pakai NIK user** → detail ditulis ke `User.detailBansos` → redirect ke dashboard → kartu "Selamat Datang" menampilkan detail otomatis (tanpa klik apa pun).

---

## 4. Validasi setelah deploy (penting)

Saya divalidasi hanya dengan **NIK dummy** (bot balas "NIK salah"). Struktur response untuk NIK valid kemungkinan sama (`messages[0].text`), tapi belum 100% diverifikasi dengan NIK asli. Setelah deploy:

1. Login sebagai user dengan NIK asli terisi di profil.
2. Tunggu login selesai (~3-6 detik — program lagi ambil detail bansos).
3. Lihat kartu dashboard — detail harus tampil otomatis.
4. Kalau detail tidak tampil / format aneh → jalankan lokal:
   ```bash
   node sociomile-bansos-client.js <NIK_ASLI>
   ```
   Paste outputnya ke saya → saya tweak ekstraksi di `sociomile-bansos.ts` kalau perlu.

Kalau fetch gagal (bot offline / NIK ditolak), login tetap berhasil — detail tetap kosong/old, retry login berikutnya. Cek log Vercel untuk pesan `[AUTO BANSOS] Gagal fetch...`.

---

## 5. Catatan teknis & batasan

- **Login jadi ~3-6 detik** (waktu panggil Sociomile + 2s jeda). User lihat loading di tombol login ~5s. Ini tradeoff dari "auto setiap login" — sesuai permintaan Anda.
- **Vercel timeout**: 2 request + 2s jeda + retry (~2s) = ~3-6s. Pas di Hobby (10s). Kalau sering timeout, naik Pro (60s) atau turunkan `retries` di `sociomile-bansos.ts`.
- **Bot offline**: MINSOS aktif jam 10:00–17:00, OFF weekend + hari libur. Di luar itu, auto-fetch gagal → login tetap berhasil, detail kosong → retry login berikutnya (jam kerja).
- **NIK wajib terisi**: user harus punya NIK 16 digit di profil. Kalau belum, auto-fetch di-skip (tidak error).
- **userId acak per login**: setiap login pakai userId baru (sesuai widget). Tidak ada state sesi lintas-login (aman, tidak bentrok).
- **Setiap login = 1 Sociomile call**: tidak spam (hanya saat login, bukan tiap klik/reload dashboard). Vercel `force-dynamic` dashboard tidak re-fetch (cuma baca `User.detailBansos` dari DB).
- **Fragilitas**: kalau Sociomile ubah endpoint/payload, auto-fetch putus. Untuk solusi stabil jangka panjang, hubungi Kemensos (`info@kemensos.go.id`) / Sociomile untuk API resmi cek bansos by NIK.

---

## 6. Privasi / etika

- NIK = data pribahasia (UU PDP). Setiap login mengirim NIK user ke bot Kemensos. Setara aksi manual user, tapi terdokumentasi → pastikan hanya user/petugas berwenang yang lihat.
- NIK dikirim ke server Sociomile (pihak ketiga, walau atas nama Kemensos). Untuk produksi skala besar, API resmi Kemensos lebih aman (data tidak lewat vendor chatbot).

---

## 7. Fitur publik: Popup "Cek Bantuan dan Desil" di Beranda (tanpa login)

Selain auto-fetch saat login (untuk user terdaftar, di atas), ada fitur **publik** di Beranda: siapa saja (tanpa login) bisa cek bantuan + desil lewat popup.

**Alur (sesuai permintaan):**
1. User klik menu **"Cek Bantuan dan Desil"** di tab Layanan Masyarakat (desktop dropdown + mobile menu — keduanya jalan).
2. Tampil **popup minta NIK**.
3. User masukkan NIK → program proses.
4. Program panggil chatbot Sociomile: kirim "cek bansos" → tunggu 2 detik → kirim NIK → ambil **jawaban terakhir**.
5. Jawaban terakhir **ditampilkan di popup**.
6. **Peringatan** kalau NIK salah / NIK bukan 16 digit.

**Installer:** `setup-cek-bansos-publik.js`. Yang dilakukan:
1. **Buat** `src/lib/server/services/sociomile-bansos.ts` — service `fetchDetailBansosByNik` (sama dengan v2; idempoten — skip kalau sudah ada).
2. **Buat** `src/lib/server/actions/cek-bansos-publik.ts` — server action publik: validasi NIK 16 digit + **rate-limit 5x/15 menit per IP** (cegah abuse, karena publik tanpa login) + panggil service + return detail atau error jelas (NIK salah / layanan offline / terlalu banyak permintaan).
3. **Buat** `src/components/cek-bansos-dialog.tsx` — popup (Dialog shadcn): input NIK + hasil + peringatan. **Auto-buka saat URL hash = `#cek-bansos`** (dipicu klik menu).
4. **Patch** `src/components/layanan-dropdown.tsx` — ubah href menu "Cek Bantuan dan Desil" dari `https://cekbansos.kemensos.go.id` → `/#cek-bansos` (cukup 1 baris; desktop + mobile otomatis pakai href baru karena keduanya render `<a href>` dari array yang sama).
5. **Patch** `src/app/(public)/layout.tsx` — render `<CekBansosDialog />` sekali (bekerja untuk semua halaman publik).
6. **git push** → Vercel auto-redeploy.

**Kenapa pakai hash `#cek-bansos`?** Cleanest: cuma ubah 1 baris href di array menu (desktop + mobile langsung jalan), 1 komponen dialog di layout. Tidak perlu patch render di 2 file menu. Klik menu → hash berubah → dialog auto-buka. Dialog tutup → hash dibersihkan.

**Sudah dites** di clone repo Anda: semua patch apply bersih, idempoten (re-run aman), output TS benar (template literal, regex, type import FormEvent — tidak ada `React.FormEvent` yang berisiko error build).

### Deploy
```bash
cd /c/Users/herman/Desktop/aplikasi-pelayanan-desa
node setup-cek-bansos-publik.js
```

### Catatan khusus fitur publik
- **Tanpa login** → siapa saja bisa akses. Rate-limit 5x/15 menit per IP cegah spam bot Sociomile. Kalau butuh lebih ketat, edit `LIMIT`/`WINDOW_MS` di `cek-bansos-publik.ts`.
- **NIK tidak disimpan** — fitur publik hanya menampilkan hasil di popup, tidak tulis ke DB (beda dengan fitur login yang simpan ke `User.detailBansos`).
- **Proses ~5-10 detik** per cek (popup loading). Bot offline (di luar 10:00–17:00 / weekend) → pesan "layanan tidak tersedia, coba lagi nanti".
- **Validasi NIK 16 digit** dua lapis: client (popup) + server (action). Pesan: "NIK harus 16 digit angka."

### Dua installer, dua fitur berbeda
| Installer | Fitur | Audiens | Hasil |
|---|---|---|---|
| `setup-sociomile-auto.js` (v2) | Auto-fetch **saat login** | User terdaftar (warga) | Detail tampil di kartu dashboard, tersimpan di DB |
| `setup-cek-bansos-publik.js` | Popup **publik** di Beranda | Siapa saja (tanpa login) | Detail tampil di popup, tidak disimpan |

Keduanya share service `sociomile-bansos.ts` (idempoten — aman jalankan keduanya). Jalankan sesuai kebutuhan, atau keduanya kalau mau dua-duanya aktif.

---

## File

- [setup-cek-bansos-publik.js](setup-cek-bansos-publik.js) — **fitur publik**: popup Cek Bantuan dan Desil di Beranda (tanpa login).
- [setup-sociomile-auto.js](setup-sociomile-auto.js) — **fitur login**: auto-fetch detail bansos saat login (dashboard, tanpa tombol).
- [sociomile-bansos-client.js](sociomile-bansos-client.js) — prototype CLI (validasi lokal dengan NIK asli).
- [PANDUAN-AUTOMASI-SOCIOMILE.md](PANDUAN-AUTOMASI-SOCIOMILE.md) — dokumen ini.

## Ringkas

**Fitur A — publik (Beranda):**
1. `node setup-cek-bansos-publik.js` → deploy.
2. User klik menu "Cek Bantuan dan Desil" → popup NIK → program panggil Sociomile → jawaban tampil di popup.
3. Warning kalau NIK salah / bukan 16 digit. Rate-limit 5x/15 menit per IP. Tanpa login.

**Fitur B — login (dashboard, dari sesi sebelumnya):**
1. `node setup-sociomile-auto.js` → deploy.
2. User login → program otomatis ambil detail bansos pakai NIK → tampil di dashboard (tanpa tombol).
3. Login ~3-6 detik. Kalau gagal, login tetap berhasil, detail retry login berikutnya.

**Validasi (kedua fitur):** saya divalidasi hanya dengan NIK dummy (bot balas "NIK salah"). Setelah deploy, tes dengan NIK asli. Kalau format hasil aneh, jalankan `node sociomile-bansos-client.js <NIK_ASLI>` → paste output ke saya untuk tweak ekstraksi di `sociomile-bansos.ts`.
