"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { sendEmail } from "../utils/email";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// === SMART KNOWLEDGE BASE ===
// Pencarian berbasis regex yang fleksibel — bisa jawab banyak variasi pertanyaan
function smartAnswer(userText: string): string {
  const t = userText.toLowerCase().trim();

  // --- KTP ---
  if (/\bktp\b|tanda penduduk|identitas/.test(t)) {
    if (/lama|berapa|estimasi|waktu|proses|selesai|kelar/.test(t))
      return "Estimasi proses KTP: 3-5 hari kerja setelah verifikasi petugas desa. Status bisa dipantau di menu Permohonan Saya.";
    if (/syarat|dokumen|berkas|persyaratan|apa saja|kelengkapan/.test(t))
      return "Dokumen yang dibutuhkan untuk KTP:\n1. Scan Kartu Keluarga (KK)\n2. Surat Pengantar RT/RW\n\nBisa diupload sebagai PDF atau foto (JPG/PNG). Foto dari kamera HP juga bisa. Auto-kompres.";
    if (/cara|gimana|bagaimana|buat|ajukan|daftar|pengajuan/.test(t))
      return "Cara mengajukan KTP:\n1. Login ke aplikasi Desa Sukamaju\n2. Klik menu 'Ajukan KTP'\n3. Pilih jenis: Baru / Perubahan / Penggantian\n4. Isi data diri lengkap\n5. Upload scan KK + surat pengantar\n6. Klik 'Kirim Permohonan'\n\nBiaya: GRATIS. Cek status di menu 'Permohonan Saya'.";
    if (/ganti|hilang|rusak|penggantian/.test(t))
      return "Untuk KTP hilang/rusak: pilih jenis 'Penggantian' saat ajuan. Dokumen sama: KK + surat pengantar. Estimasi 3-5 hari kerja.";
    return "KTP bisa diajukan via aplikasi: menu Ajukan KTP. Ada 3 jenis (Baru/Perubahan/Penggantian). Dokumen: KK + surat pengantar. Bisa tanya: 'cara buat ktp', 'syarat ktp', 'berapa lama ktp'.";
  }

  // --- KK ---
  if (/\bkk\b|kartu keluarga|family card/.test(t)) {
    if (/syarat|dokumen|berkas/.test(t))
      return "Dokumen KK: KTP kepala keluarga + akta kelahiran + surat pengantar RT/RW.";
    return "Cara ajuan KK:\n1. Login → menu Ajukan KK\n2. Isi data kepala keluarga + anggota keluarga\n3. Upload KTP + akta + pengantar\n4. Klik Kirim Permohonan\n\nBiaya: GRATIS.";
  }

  // --- SKL (Kelahiran) ---
  if (/skl|kelahiran|akta lahir|surat lahir|bayi|baru lahir/.test(t)) {
    return "Surat Keterangan Kelahiran (SKL):\nCara: Login → Ajukan SKL → isi data bayi + orang tua → upload KK + pengantar + surat lahir RS/bidan → kirim.\nDokumen: KK, surat pengantar, surat lahir dari RS/bidan.";
  }

  // --- SKTM ---
  if (/sktm|tidak mampu|miskin|surat miskin|keterangan tidak mampu/.test(t)) {
    return "Surat Keterangan Tidak Mampu (SKTM):\nCara: Login → Ajukan SKTM → isi data + alasan → upload KK + KTP + pengantar → kirim.\nDokumen: KK, KTP pemohon, surat pengantar.\nKegunaan: beasiswa, keringanan RS, bansos, dll.";
  }

  // --- SKK ---
  if (/skk|kematian|meninggal|surat mati/.test(t)) {
    return "Surat Keterangan Kematian (SKK):\nCara: Login → Ajukan SKK → isi data almarhum + ahli waris → kirim.\nTidak perlu upload dokumen — diverifikasi langsung oleh petugas desa.\nEstimasi: 1-2 hari kerja.";
  }

  // --- SKU ---
  if (/sku|surat usaha|usaha|dagang|bisnis|izin usaha|warung|toko/.test(t)) {
    return "Surat Keterangan Usaha (SKU):\nCara: Login → Ajukan SKU → isi data usaha → upload KK + KTP + pengantar + bukti usaha → kirim.\nDokumen: KK, KTP, surat pengantar, bukti usaha.\nKegunaan: NIB, BPOM, buka rekening bisnis.";
  }

  // --- SKD ---
  if (/skd|domisili|tempat tinggal|surat tinggal/.test(t)) {
    return "Surat Keterangan Domisili (SKD):\nCara: Login → Ajukan SKD → isi data + alamat → upload KK + KTP + pengantar → kirim.\nDokumen: KK, KTP, surat pengantar.";
  }

  // --- BANSOS (cek, status, cara) ---
  if (/cek.*bansos|status.*bansos|bansos.*cek|lihat.*bansos|bansos.*status|bansos.*lihat/.test(t)) {
    return "Cara cek status bansos:\n1. Login ke aplikasi\n2. Klik menu 'Cek Status Bansos'\n3. Klik tombol 'Buka Sociomile'\n4. Di Sociomile: kirim pesan 'cek bansos'\n5. Tunggu balasan, masukkan NIK Anda\n6. Copy hasil balasan\n7. Kembali ke aplikasi, paste hasil di kolom 'Detail Bansos'\n8. Klik Simpan\n\nHasil tersimpan dan tampil di dashboard.\nAtau ketik 'cs' untuk hubungi petugas langsung.";
  }

  // --- BANSOS (umum) ---
  if (/bansos|bantuan|blt|pkh|bpnt|pip|bst|sembako|bantuan sosial|bantuan tunai/.test(t)) {
    if (/blt|bantuan langsung tunai/.test(t))
      return "BLT (Bantuan Langsung Tunai): bantuan uang tunai langsung ke penerima. Cek status via menu Cek Bansos atau ketik 'cs'.";
    if (/pkh|keluarga harapan/.test(t))
      return "PKH (Program Keluarga Harapan): bantuan untuk keluarga miskin dengan anak sekolah/ibu hamil/lansia/disabilitas. Cek via Cek Bansos.";
    if (/bpnt|bantuan pangan/.test(t))
      return "BPNT (Bantuan Pangan Non Tunai): bantuan sembako via kartu. Cek via Cek Bansos.";
    if (/pip|pendidikan|sekolah|siswa/.test(t))
      return "PIP (Program Indonesia Pintar): bantuan untuk siswa miskin. Cek via Cek Bansos.";
    return "Jenis bansos yang tersedia:\n• BPNT (Bantuan Pangan)\n• BLT (Bantuan Tunai)\n• PKH (Keluarga Harapan)\n• PIP (Pendidikan)\n• BST (Sosial Tunai)\n\nCek status: menu Cek Status Bansos → Sociomile → masukkan NIK. Atau ketik 'cs' untuk petugas.";
  }

  // --- Perbaikan Desil ---
  if (/desil|perbaikan desil/.test(t)) {
    return "Perbaikan Desil: fitur untuk koreksi data klasifikasi sosial ekonomi warga.\nCuma admin/petugas yang bisa akses: menu Kelola Perbaikan Desil.";
  }

  // --- Lampid ---
  if (/lampid|laporan penduduk|laporan bulanan/.test(t)) {
    return "Lampid Bulanan: laporan penduduk per RW/RT setiap bulan.\nCara: admin/petugas → Kelola Lampid → Bulanan → pilih bulan/tahun → Buat Laporan. Bisa Export Excel & Print.";
  }

  // --- Laporan usia ---
  if (/laporan.*usia|berdasarkan.*usia|kelompok.*umur|distribusi.*umur/.test(t)) {
    return "Laporan Berdasarkan Usia: distribusi penduduk per kelompok umur (0-4, 5-9, dst).\nCara: admin/petugas → Kelola Lampid → Berdasarkan Usia → pilih bulan → Buat Laporan.";
  }

  // --- Data warga ---
  if (/data warga|kelola.*data|input.*warga|input.*penduduk|tambah.*warga/.test(t)) {
    return "Kelola Data Warga: input & kelola data penduduk.\nCara: Login → Kelola Data Warga → tab Penduduk (tetap) / Sementara / Kejadian.\nAdmin bisa input semua RT. RT hanya input RT sendiri.\nBisa import Excel. Ada foto kepala keluarga (kamera/galeri).";
  }

  // --- Foto KK ---
  if (/foto.*kk|foto.*kepala|pas.*foto|foto.*warga/.test(t)) {
    return "Foto Kepala Keluarga:\nDi Kelola Data Warga, tiap grup KK punya avatar bulat. Klik tombol kamera → ambil dari kamera/galeri → auto-kompres. Klik foto untuk perbesar.";
  }

  // --- Login/Daftar ---
  if (/daftar|registrasi|buat.*akun|sign.?up|gabung|register/.test(t)) {
    return "Cara daftar akun:\n1. Klik 'Masuk / Daftar'\n2. Pilih tab Daftar\n3. Isi: Nama, NIK (16 digit), Email, Password\n4. Upload selfie (foto wajah)\n5. Klik Daftar\n6. Cek email untuk verifikasi\n7. Admin aktivasi akun\n\nSetelah aktif, bisa login dan ajukan layanan.";
  }
  if (/login|masuk|sign.?in/.test(t)) {
    return "Cara login:\n1. Klik 'Masuk / Daftar'\n2. Tab Masuk\n3. Masukkan Email + Password\n4. Klik Masuk\n\nBelum punya akun? Ketik 'daftar' untuk cara daftar.";
  }

  // --- Lokasi ---
  if (/alamat|lokasi|kantor.*desa|dimana|tempat|peta/.test(t)) {
    return "Kantor Desa Sukamaju:\nAlamat: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630\nKecamatan: Cibungbulang\nKabupaten: Bogor\nProvinsi: Jawa Barat";
  }

  // --- Waktu sekarang (CEK SEBELUM jam layanan) ---
  if (/jam.*berapa|waktu.*sekarang|pukul.*berapa|sekarang.*jam/.test(t)) {
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return "Sekarang jam " + now + " WIB.\n\nJam layanan kantor: Senin-Jumat 08.00-14.00. Pengajuan online: 24 jam.";
  }

  // --- Jam layanan ---
  if (/jam.*buka|jam.*layanan|jam.*kerja|kapan.*buka|\bbuka\b/.test(t)) {
    return "Jam Layanan Kantor:\nSenin - Jumat: 08.00 - 14.00 WIB\nSabtu & Minggu: Tutup\n\nPengajuan online: 24 jam via aplikasi.";
  }

  // --- Kontak ---
  if (/telepon|telp|hp|wa|whatsapp|hubungi|nomor|kontak|phone/.test(t)) {
    return "Kontak Desa Sukamaju:\nTelepon/WA: +62 812-8569-9854\nAlamat: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630\nJam: Senin-Jumat 08.00-14.00\n\nKetik 'cs' untuk hubungi petugas langsung via WhatsApp.";
  }

  // --- Upload (CEK SEBELUM dokumen/syarat supaya tidak tertimpa) ---
  if (/upload|unggah|cara.*upload|kamera|foto.*dokumen/.test(t)) {
    return "Cara upload dokumen:\n• Format: PDF, JPG, PNG, WebP\n• Maks: 9 MB (gambar auto-kompres)\n• Klik area upload → pilih file\n• Atau klik 'ambil foto dari kamera'\n• Gambar bisa diputar sebelum upload\n• Preview tampil setelah upload";
  }

  // --- Dokumen/Syarat umum ---
  if (/syarat|dokumen|berkas|persyaratan|kelengkapan|apa.*saja.*dibutuhkan/.test(t)) {
    return "Dokumen umum semua pengajuan:\n• Scan Kartu Keluarga (KK)\n• Surat Pengantar RT/RW\n\nTambahan per layanan:\n- KTP: cukup KK + pengantar\n- KK: + KTP + akta\n- SKL: + surat lahir RS\n- SKTM: + KTP\n- SKU: + bukti usaha\n- SKD: + KTP\n\nSemua bisa PDF atau foto. Foto dari kamera HP bisa.";
  }

  // --- Status pengajuan ---
  if (/status|pengajuan.*saya|permohonan.*saya|cek.*pengajuan|proses.*pengajuan/.test(t)) {
    return "Cek status pengajuan:\n1. Login → menu 'Permohonan Saya'\n2. Lihat daftar semua pengajuan\n3. Status: DIAJUKAN → DISETUJUI / DITOLAK\n\nNotifikasi email dikirim saat status berubah.";
  }

  // --- Profil desa ---
  if (/profil|tentang.*desa|sejarah|info.*desa|sukamaju/.test(t)) {
    return "Desa Sukamaju:\nKec. Cibungbulang, Kab. Bogor, Jawa Barat.\nKode Pos: 16630. Luas: ±425 Ha. RW: 8, RT: 24.\nMayoritas: pertanian & perkebunan.\nNama 'Sukamaju' = harapan warga hidup suka dan maju.";
  }

  // --- Siapa kamu (CEK SEBELUM salam) ---
  if (/siapa.*kamu|kamu.*siapa|kamu.*apa|nama.*kamu|\bbot\b|\bai\b|asisten|kamu.*orang/.test(t)) {
    return "Saya CS AI Desa Sukamaju — asisten virtual yang siap bantu Anda seputar layanan desa, bantuan sosial, dan cara menggunakan aplikasi.\n\nTanya apa saja, atau ketik 'cs' untuk bicara dengan petugas.";
  }

  // --- Cuaca/waktu (CEK SEBELUM jam layanan) ---
  if (/cuaca|hujan|panas|dingin|iklim/.test(t)) {
    return "Untuk info cuaca Desa Sukamaju, cek aplikasi cuaca di HP atau Google.\n\nUntuk layanan desa: KTP, KK, bansos, dll. Ada yang bisa saya bantu?";
  }
  if (/jam.*berapa|waktu.*sekarang|pukul.*berapa|sekarang.*jam/.test(t)) {
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return "Sekarang jam " + now + " WIB.\n\nJam layanan kantor: Senin-Jumat 08.00-14.00. Pengajuan online: 24 jam.";
  }

  // --- Salam ---
  if (/halo|hai|hello|\bhi\b|pagi|siang|sore|malam|assalam/.test(t)) {
    return "Halo! 👋 Selamat datang di CS AI Desa Sukamaju.\n\nSaya bisa bantu seputar:\n📋 Layanan: KTP, KK, SKL, SKTM, SKK, SKU, SKD\n🤝 Bansos: cek status, jenis bantuan\n📱 Cara pakai aplikasi\n📍 Lokasi, jam, kontak desa\n\nSilakan bertanya apa saja!";
  }

  // --- Terima kasih ---
  if (/terima kasih|makasih|thanks|thank you|suwun|nggih|\boke\b|\bok\b|sip|baiklah/.test(t)) {
    return "Sama-sama! 😊 Senang bisa membantu.\nKalau ada pertanyaan lain, tanya saja. Atau ketik 'cs' untuk hubungi petugas via WhatsApp.";
  }

  // --- Default: tetap membantu ---
  return "Saya bisa bantu dengan topik ini:\n📋 Layanan: KTP, KK, SKL, SKTM, SKK, SKU, SKD\n🤝 Bansos (cek status, jenis)\n📱 Cara pakai aplikasi (daftar, upload, cek status)\n📍 Lokasi, jam, kontak desa\n❓ Pertanyaan umum\n\nCoba tanya lebih spesifik, atau ketik 'cs' untuk hubungi petugas via WhatsApp.";
}

// === AI CHAT: Z.ai API + smart fallback ===
const SYSTEM_PROMPT = `Anda adalah "CS AI Desa Sukamaju" — asisten virtual ramah untuk Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor.

INFO DESA: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630. WA: +62 812-8569-9854. Jam: Senin-Jumat 08.00-14.00.

LAYANAN: KTP, KK, SKL(kelahiran), SKTM(tidak mampu), SKK(kematian), SKU(usaha), SKD(domisili). Semua via aplikasi: login → pilih layanan → isi data → upload → kirim.

BANSOS: BPNT, BLT, PKH, PIP, BST. Cek via menu Cek Status Bansos → Sociomile → masukkan NIK → copy hasil → paste di aplikasi.

ATURAN: Jawab Bahasa Indonesia, singkat, ramah, fleksibel. Bisa jawab pertanyaan umum. Sarankan ketik "cs" untuk petugas. Jangan bilang tidak tahu.`;

export async function aiChatAction(messages: ChatMessage[]) {
  try {
    const apiKey = process.env.ZAI_API_KEY;

    // Coba Z.ai API
    if (apiKey) {
      try {
        const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "glm-4.5-air",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }))],
            temperature: 0.7, max_tokens: 500,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return { status: 200, reply };
        }
      } catch {}
    }

    // Fallback: smart knowledge base
    const lastMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastMsg) return { status: 200, reply: "Silakan bertanya." };
    const lower = lastMsg.content.toLowerCase().trim();
    if (["cs", "chat dengan petugas", "chat petugas", "petugas"].includes(lower)) {
      return { status: 200, reply: "", isPetugasRequest: true };
    }
    return { status: 200, reply: smartAnswer(lastMsg.content) };
  } catch {
    return { status: 200, reply: "Maaf, gangguan koneksi. Ketik 'cs' untuk petugas." };
  }
}

// === GET LIVECHAT AGENTS ===
export async function getLivechatAgentsAction() {
  try {
    const agents = await prisma.user.findMany({ where: { isLivechatAgent: true, status: "ACTIVE", role: "PETUGAS" }, select: { userId: true, name: true, phone: true, jabatan: true, tugasPetugas: true } });
    return { status: 200, agents: agents.filter(a => a.phone) };
  } catch { return { status: 200, agents: [] }; }
}

// === TOGGLE LIVECHAT AGENT ===
export async function toggleLivechatAgentAction(userId: string, enabled: boolean) {
  try {
    const s = await findCurrentSessionService();
    if (!s?.user || s.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin.");
    await prisma.user.update({ where: { userId }, data: { isLivechatAgent: enabled } });
    revalidatePath("/livechat-settings");
    return { status: 200, message: `Petugas ${enabled ? "ditambahkan" : "dihapus"}` };
  } catch (e) { if (e instanceof ApiError) return { status: e.statusCode, error: e.message }; return { status: 500, error: "Terjadi kesalahan" }; }
}

// === GET ALL PETUGAS ===
export async function getAllPetugasAction() {
  try {
    const s = await findCurrentSessionService();
    if (!s?.user || s.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin.");
    const petugas = await prisma.user.findMany({ where: { role: "PETUGAS", status: "ACTIVE" }, select: { userId: true, name: true, email: true, phone: true, jabatan: true, tugasPetugas: true, isLivechatAgent: true }, orderBy: { name: "asc" } });
    return { status: 200, petugas };
  } catch (e) { if (e instanceof ApiError) return { status: e.statusCode, error: e.message }; return { status: 500, error: "Terjadi kesalahan" }; }
}

// === SEND CHAT HISTORY EMAIL — pakai sendEmail dari utils/email.ts ===
export async function sendChatHistoryEmailAction(email: string, nama: string, chatHistory: Array<{ role: string; content: string; timestamp: string }>) {
  try {
    if (!email || !email.includes("@") || !email.includes(".")) return { status: 400, error: "Email tidak valid" };

    const chatText = chatHistory.map(m => `[${m.timestamp}] ${m.role === "user" ? "Anda" : "CS AI"}: ${m.content}`).join("\n\n");
    const html = `<h2>Histori Chat CS AI Desa Sukamaju</h2><p>Halo <strong>${nama}</strong>,</p><p>Berikut riwayat chat Anda:</p><div style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-line;font-family:monospace;font-size:13px;">${chatText}</div><p style="margin-top:16px;color:#666;font-size:12px;">Email otomatis dari Portal Desa Sukamaju.</p>`;

    await sendEmail(email, "Histori Chat CS AI Desa Sukamaju", html);
    return { status: 200, message: "Histori berhasil dikirim ke " + email };
  } catch (error) {
    console.error("ERROR send email:", error);
    return { status: 500, error: "Gagal kirim email: " + (error instanceof Error ? error.message : "unknown") };
  }
}
