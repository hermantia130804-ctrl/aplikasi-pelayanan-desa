"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import nodemailer from "nodemailer";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// === KNOWLEDGE BASE — jawaban berbasis aturan, tanpa API eksternal ===
const KNOWLEDGE_BASE: Array<{ keywords: string[]; answer: string }> = [
  // === Layanan KTP ===
  {
    keywords: ["ktp", "kartu tanda penduduk", "buat ktp", "ajuan ktp", "pengajuan ktp", "ganti ktp", "ktp baru", "ktp hilang", "ktp rusak"],
    answer: "📋 **Pengajuan KTP**\n\nJenis pengajuan: Baru, Perubahan Data, Penggantian (hilang/rusak).\n\nCara mengajukan:\n1. Login ke aplikasi\n2. Buka menu Ajukan KTP\n3. Isi data diri\n4. Upload scan KK + surat pengantar RT/RW (bisa PDF atau foto)\n5. Klik Kirim Permohonan\n\nDokumen yang dibutuhkan:\n- Scan Kartu Keluarga\n- Surat Pengantar RT/RW\n\nBiaya: GRATIS\nEstimasi: 3-5 hari kerja setelah verifikasi",
  },
  // === Layanan KK ===
  {
    keywords: ["kk", "kartu keluarga", "buat kk", "ajuan kk", "pengajuan kk", "ganti kk", "kk baru", "tambah anggota", "kk hilang"],
    answer: "📋 **Pengajuan Kartu Keluarga**\n\nCara mengajukan:\n1. Login ke aplikasi\n2. Buka menu Ajukan KK\n3. Isi data kepala keluarga + anggota\n4. Upload scan KTP, Akta Kelahiran, Surat Pengantar\n5. Klik Kirim Permohonan\n\nDokumen yang dibutuhkan:\n- Scan KTP kepala keluarga\n- Akta Kelahiran\n- Surat Pengantar RT/RW\n\nBiaya: GRATIS",
  },
  // === Layanan SKL ===
  {
    keywords: ["skl", "surat keterangan kelahiran", "akta lahir", "kelahiran", "surat lahir", "buat skl"],
    answer: "📋 **Surat Keterangan Kelahiran (SKL)**\n\nCara mengajukan:\n1. Login ke aplikasi\n2. Buka menu Ajukan SKL\n3. Isi data bayi + orang tua\n4. Upload scan KK, surat pengantar, surat lahir rumah sakit\n5. Klik Kirim Permohonan\n\nDokumen: KK, Surat Pengantar RT/RW, Surat Lahir RS/Bidan",
  },
  // === Layanan SKTM ===
  {
    keywords: ["sktm", "surat keterangan tidak mampu", "tidak mampu", "surat miskin", "keterangan tidak mampu"],
    answer: "📋 **Surat Keterangan Tidak Mampu (SKTM)**\n\nCara mengajukan:\n1. Login ke aplikasi\n2. Buka menu Ajukan SKTM\n3. Isi data + alasan ketidakmampuan\n4. Upload scan KK, KTP, Surat Pengantar\n5. Klik Kirim Permohonan\n\nDokumen: KK, KTP pemohon, Surat Pengantar RT/RW\n\nSKTM digunakan untuk: beasiswa, keringanan biaya rumah sakit, bantuan sosial, dll.",
  },
  // === Layanan SKK ===
  {
    keywords: ["skk", "surat keterangan kematian", "kematian", "surat mati", " meninggal"],
    answer: "📋 **Surat Keterangan Kematian (SKK)**\n\nCara mengajukan:\n1. Login ke aplikasi\n2. Buka menu Ajukan SKK\n3. Isi data almarhum + ahli waris\n4. Klik Kirim Permohonan\n\nTidak perlu upload dokumen — data diverifikasi oleh petugas desa.\n\nEstimasi: 1-2 hari kerja",
  },
  // === Layanan SKU ===
  {
    keywords: ["sku", "surat keterangan usaha", "usaha", "izin usaha", "surat usaha", "dagang"],
    answer: "📋 **Surat Keterangan Usaha (SKU)**\n\nCara mengajukan:\n1. Login ke aplikasi\n2. Buka menu Ajukan SKU\n3. Isi data usaha (jenis, alamat, modal)\n4. Upload scan KK, KTP, Surat Pengantar, bukti usaha\n5. Klik Kirim Permohonan\n\nDokumen: KK, KTP, Surat Pengantar RT/RW, Surat Pernyataan Usaha\n\nSKU digunakan untuk: NIB, izin BPOM, pembukaan rekening bisnis, dll.",
  },
  // === Layanan SKD ===
  {
    keywords: ["skd", "surat keterangan domisili", "domisili", "surat tinggal", "tempat tinggal"],
    answer: "📋 **Surat Keterangan Domisili (SKD)**\n\nCara mengajukan:\n1. Login ke aplikasi\n2. Buka menu Ajukan SKD\n3. Isi data + alamat domisili\n4. Upload scan KK, KTP, Surat Pengantar\n5. Klik Kirim Permohonan\n\nDokumen: KK, KTP, Surat Pengantar RT/RW",
  },
  // === Bansos ===
  {
    keywords: ["bansos", "bantuan sosial", "bantuan", "blt", "pkh", "bpnt", "pip", "bst", "bantuan tunai", "sembako"],
    answer: "🤝 **Bantuan Sosial (Bansos)**\n\nJenis bansos:\n- BPNT (Bantuan Pangan Non Tunai)\n- BLT (Bantuan Langsung Tunai)\n- PKH (Program Keluarga Harapan)\n- PIP (Program Indonesia Pintar)\n- BST (Bantuan Sosial Tunai)\n\nCara cek status bansos:\n1. Login ke aplikasi\n2. Buka menu Cek Status Bansos\n3. Klik link Sociomile\n4. Kirim pesan 'cek bansos'\n5. Masukkan NIK Anda\n6. Copy hasil, paste di aplikasi\n\nAtau ketik 'cs' untuk hubungi petugas via WhatsApp.",
  },
  // === Cek bansos ===
  {
    keywords: ["cek bansos", "cek status bansos", "status bansos", "cara cek bansos", "lihat bansos"],
    answer: "🔍 **Cek Status Bansos**\n\nCara cek:\n1. Login ke aplikasi\n2. Klik menu Cek Status Bansos\n3. Klik tombol 'Buka Sociomile'\n4. Di Sociomile: kirim pesan 'cek bansos'\n5. Masukkan NIK Anda\n6. Copy hasil balasan\n7. Kembali ke aplikasi, paste di kolom Detail Bansos\n8. Klik Simpan\n\nAtau ketik 'cs' untuk hubungi petugas langsung.",
  },
  // === Perbaikan Desil ===
  {
    keywords: ["desil", "perbaikan desil", "kelola desil", "data desil"],
    answer: "📋 **Perbaikan Desil**\n\nFitur ini untuk perbaikan/koreksi data desil (klasifikasi sosial ekonomi).\n\nCara:\n1. Login sebagai admin/petugas\n2. Buka menu Kelola Perbaikan Desil\n3. Pilih warga yang perlu diperbaiki\n4. Input data desil yang baru\n5. Simpan\n\nHanya admin/petugas yang dapat mengakses fitur ini.",
  },
  // === Lampid ===
  {
    keywords: ["lampid", "laporan penduduk", "laporan bulanan", "lapor penduduk", "data penduduk bulanan"],
    answer: "📊 **Laporan Penduduk Bulanan (Lampid)**\n\nFitur ini untuk laporan penduduk per RT/RW setiap bulan.\n\nIsi laporan:\n- Jml penduduk bulan lalu (L/P)\n- Lahir, Mati, Datang, Pindah\n- Jml penduduk bulan ini\n- Kartu Keluarga & KTP\n\nCara:\n1. Login sebagai admin/petugas\n2. Buka menu Kelola Lampid → Bulanan\n3. Pilih bulan & tahun\n4. Klik Buat Laporan\n5. Bisa Export Excel & Print",
  },
  // === Laporan usia ===
  {
    keywords: ["laporan usia", "berdasarkan usia", "kelompok umur", "data usia", "usia penduduk"],
    answer: "📊 **Laporan Berdasarkan Usia**\n\nLaporan distribusi penduduk per kelompok umur (0-4, 5-9, 10-14, ... 70+).\n\nCara:\n1. Login sebagai admin/petugas\n2. Buka menu Kelola Lampid → Berdasarkan Usia\n3. Pilih bulan & tahun\n4. Klik Buat Laporan\n5. Bisa Export Excel & Print",
  },
  // === Data Warga ===
  {
    keywords: ["data warga", "kelola data warga", "input warga", "tambah warga", "input penduduk", "data penduduk"],
    answer: "👥 **Kelola Data Warga**\n\nFitur untuk input dan kelola data penduduk desa.\n\nCara:\n1. Login sebagai admin/petugas/RT\n2. Buka menu Kelola Data Warga\n3. Tab Penduduk: data tetap (KTP/KK)\n4. Tab Penduduk Sementara: warga kontrakan/tamu\n5. Tab Kejadian: lahir, mati, pindah, datang\n\nAdmin bisa input semua RT. RT hanya input RT sendiri.\nBisa import data via Excel.",
  },
  // === Foto KK ===
  {
    keywords: ["foto kk", "foto kepala keluarga", "foto profil kk", "foto warga", "pas foto"],
    answer: "📸 **Foto Kepala Keluarga**\n\nSetiap kepala keluarga bisa punya foto profil di aplikasi.\n\nCara:\n1. Buka Kelola Data Warga\n2. Di setiap grup KK, ada avatar bulat di sebelah nama kepala keluarga\n3. Klik tombol kamera kecil\n4. Pilih: Ambil dari Kamera atau Pilih dari Galeri\n5. Foto otomatis dikompres (max 800px)\n6. Klik foto untuk perbesar\n\nHanya kepala keluarga yang punya foto.",
  },
  // === Login/Daftar ===
  {
    keywords: ["login", "masuk", "daftar", "registrasi", "buat akun", "gabung", "sign up", "sign in", "akun"],
    answer: "🔐 **Login & Daftar**\n\nCara daftar akun baru:\n1. Buka aplikasi\n2. Klik 'Masuk / Daftar'\n3. Pilih tab Daftar\n4. Isi: Nama, NIK, Email, Password\n5. Upload selfie (foto wajah)\n6. Klik Daftar\n7. Cek email untuk verifikasi\n\nCara login:\n1. Klik 'Masuk / Daftar'\n2. Pilih tab Masuk\n3. Masukkan Email + Password\n4. Klik Masuk\n\nAkun akan diverifikasi admin sebelum aktif.",
  },
  // === Lokasi & Kontak ===
  {
    keywords: ["alamat", "lokasi", "kantor", "kantor desa", "dimana", "tempat", "alamat desa", "peta"],
    answer: "📍 **Lokasi Kantor Desa Sukamaju**\n\nAlamat: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630\nKecamatan: Cibungbulang\nKabupaten: Bogor\nProvinsi: Jawa Barat\n\nTelepon/WA: +62 812-8569-9854\nJam Layanan: Senin-Jumat, 08.00-14.00 WIB",
  },
  // === Jam layanan ===
  {
    keywords: ["jam", "jam buka", "jam layanan", "jam kerja", "jam kantor", "kapan buka", "buka"],
    answer: "🕐 **Jam Layanan**\n\nSenin - Jumat: 08.00 - 14.00 WIB\nSabtu & Minggu: Tutup\n\nUntuk pengajuan online: bisa 24 jam via aplikasi",
  },
  // === Kontak ===
  {
    keywords: ["kontak", "telepon", "telp", "hp", "whatsapp", "wa", "hubungi", "nomor", "phone"],
    answer: "📞 **Kontak Desa Sukamaju**\n\nTelepon/WA: +62 812-8569-9854\nEmail: tersedia di aplikasi\nAlamat: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630\n\nAtau ketik 'cs' untuk terhubung langsung dengan petugas via WhatsApp.",
  },
  // === Syarat dokumen ===
  {
    keywords: ["syarat", "dokumen", "persyaratan", "berkas", "yang dibutuhkan", "apa saja", "kelengkapan"],
    answer: "📎 **Dokumen Umum yang Dibutuhkan**\n\nUntuk semua pengajuan:\n- Scan Kartu Keluarga (KK)\n- Surat Pengantar RT/RW\n\nTambahan per layanan:\n- KTP: cukup KK + pengantar\n- KK: + KTP + Akta\n- SKL: + surat lahir RS/bidan\n- SKTM: + KTP pemohon\n- SKU: + bukti usaha\n- SKD: + KTP\n\nSemua dokumen bisa diupload sebagai PDF atau foto (JPG/PNG). Foto dari kamera HP juga bisa.",
  },
  // === Upload dokumen ===
  {
    keywords: ["upload", "unggah", "cara upload", "upload dokumen", "upload file", "kamera", "foto dokumen"],
    answer: "📤 **Cara Upload Dokumen**\n\nFormat yang diterima: PDF, JPG, PNG, WebP\nMaksimal: 9 MB (gambar auto-kompres)\n\nCara upload:\n1. Klik area upload di form pengajuan\n2. Pilih file dari HP/komputer\n3. Untuk gambar: bisa edit (putar) sebelum upload\n4. Atau klik 'ambil foto dari kamera'\n5. Foto langsung dari kamera HP\n6. Klik Upload\n7. Preview dokumen akan tampil\n\nSetelah upload, dokumen tersimpan aman di server.",
  },
  // === Status pengajuan ===
  {
    keywords: ["status", "cek status", "pengajuan saya", "permohonan saya", "lihat pengajuan", " Lamaran", "proses pengajuan"],
    answer: "📋 **Cek Status Pengajuan**\n\nCara cek:\n1. Login ke aplikasi\n2. Buka menu 'Permohonan Saya'\n3. Lihat daftar semua pengajuan Anda\n4. Status: DIAJUKAN → DISETUJUI / DITOLAK\n\nNotifikasi email dikirim saat status berubah.",
  },
  // === Salam ===
  {
    keywords: ["halo", "hai", "hello", "hi", "selamat pagi", "selamat siang", "selamat sore", "selamat malam", "assalam", "assalamualaikum", "p"],
    answer: "Halo! 👋 Selamat datang di CS AI Desa Sukamaju.\n\nSaya siap membantu Anda seputar:\n- Layanan administrasi (KTP, KK, SKL, SKTM, SKK, SKU, SKD)\n- Bantuan sosial (bansos)\n- Cara menggunakan aplikasi\n- Informasi desa\n\nSilakan bertanya! Atau ketik 'cs' untuk hubungi petugas.",
  },
  // === Terima kasih ===
  {
    keywords: ["terima kasih", "makasih", "thanks", "thank you", "suwun", "nggih", "oke", "ok", "baik", "sip"],
    answer: "Sama-sama! 😊 Senang bisa membantu.\n\nKalau ada pertanyaan lain, silakan tanya. Atau ketik 'cs' untuk hubungi petugas via WhatsApp.",
  },
  // === Profil desa ===
  {
    keywords: ["profil", "tentang desa", "info desa", "sukamaju", "sejarah", "desa", "profil desa"],
    answer: "🏘️ **Profil Desa Sukamaju**\n\nDesa Sukamaju berada di Kecamatan Cibungbulang, Kabupaten Bogor, Jawa Barat.\n\nKode Pos: 16630\nLuas Wilayah: ±425 Ha\nJumlah RW: 8\nJumlah RT: 24\n\nMayoritas penduduk: pertanian, perkebunan, peternakan.\nNama 'Sukamaju' bermakna harapan agar warganya hidup suka dan maju.\n\nKantor: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor.",
  },
  // === WhatsApp petugas ===
  {
    keywords: ["petugas", "cs", "chat dengan petugas", "chat petugas", "admin", "orang", "manusia", "live agent", "operator"],
    answer: "PETUGAS_PROMPT",
  },
];

function findAnswer(userText: string): string {
  const lower = userText.toLowerCase().trim();

  // Cek keyword match
  for (const item of KNOWLEDGE_BASE) {
    for (const kw of item.keywords) {
      if (lower.includes(kw)) {
        if (item.answer === "PETUGAS_PROMPT") {
          return "PETUGAS_PROMPT";
        }
        return item.answer;
      }
    }
  }

  // Jika tidak ada match — jawaban umum yang tetap membantu
  const generalResponses = [
    "Maaf, saya belum sepenuhnya mengerti pertanyaan Anda. 🤔\n\nBerikut topik yang bisa saya bantu:\n- Layanan: KTP, KK, SKL, SKTM, SKK, SKU, SKD\n- Bantuan sosial (bansos)\n- Cara menggunakan aplikasi\n- Lokasi & kontak desa\n- Jam layanan\n\nSilakan tanya lebih spesifik, atau ketik 'cs' untuk hubungi petugas.",
    "Saya belum menemukan jawaban yang tepat untuk pertanyaan itu. 😅\n\nCoba tanya dengan kata kunci seperti:\n'ktp', 'kk', 'bansos', 'cek bansos', 'jam layanan', 'alamat', 'cara daftar', 'upload dokumen'\n\nAtau ketik 'cs' untuk bicara dengan petugas.",
    "Hmm, saya butuh informasi lebih spesifik. 💭\n\nSaya bisa bantu dengan:\n📋 Layanan administrasi (KTP/KK/SKL/SKTM/SKK/SKU/SKD)\n🤝 Bantuan sosial\n📱 Cara pakai aplikasi\n📍 Lokasi & kontak\n🕐 Jam layanan\n\nKetik 'cs' jika ingin hubungi petugas langsung.",
  ];

  // Pilih respons berdasarkan panjang input
  const idx = userText.length % generalResponses.length;
  return generalResponses[idx];
}

// === AI CHAT — berbasis knowledge base (tanpa API eksternal) ===
export async function aiChatAction(messages: ChatMessage[]) {
  try {
    // Ambil pesan user terakhir
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) {
      return { status: 200, reply: "Silakan bertanya seputar layanan desa Sukamaju." };
    }

    const answer = findAnswer(lastUserMessage.content);

    if (answer === "PETUGAS_PROMPT") {
      return { status: 200, reply: "PETUGAS_PROMPT", isPetugasRequest: true };
    }

    return { status: 200, reply: answer };
  } catch (error) {
    console.error("ERROR AI chat:", error);
    return { status: 200, reply: "Maaf, saya tidak dapat menjawab saat ini. Ketik 'cs' untuk hubungi petugas." };
  }
}

// === GET LIVECHAT AGENTS ===
export async function getLivechatAgentsAction() {
  try {
    const agents = await prisma.user.findMany({
      where: {
        isLivechatAgent: true,
        status: "ACTIVE",
        role: "PETUGAS",
      },
      select: {
        userId: true,
        name: true,
        phone: true,
        jabatan: true,
        tugasPetugas: true,
      },
    });

    const validAgents = agents.filter(a => a.phone);
    return { status: 200, agents: validAgents };
  } catch (error) {
    console.error("ERROR get livechat agents:", error);
    return { status: 200, agents: [] };
  }
}

// === TOGGLE LIVECHAT AGENT (admin) ===
export async function toggleLivechatAgentAction(userId: string, enabled: boolean) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new ApiError(status.FORBIDDEN, "Hanya admin yang dapat mengatur livechat.");
    }
    await prisma.user.update({
      where: { userId },
      data: { isLivechatAgent: enabled },
    });
    revalidatePath("/livechat-settings");
    return { status: 200, message: `Petugas ${enabled ? "ditambahkan ke" : "dihapus dari"} livechat` };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    return { status: 500, error: "Terjadi kesalahan" };
  }
}

// === GET ALL PETUGAS (for admin settings) ===
export async function getAllPetugasAction() {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new ApiError(status.FORBIDDEN, "Hanya admin.");
    }
    const petugas = await prisma.user.findMany({
      where: { role: "PETUGAS", status: "ACTIVE" },
      select: {
        userId: true, name: true, email: true, phone: true,
        jabatan: true, tugasPetugas: true, isLivechatAgent: true,
      },
      orderBy: { name: "asc" },
    });
    return { status: 200, petugas };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    return { status: 500, error: "Terjadi kesalahan" };
  }
}

// === SEND CHAT HISTORY EMAIL ===
export async function sendChatHistoryEmailAction(
  email: string, nama: string,
  chatHistory: Array<{ role: string; content: string; timestamp: string }>
) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const chatText = chatHistory
      .map(m => `[${m.timestamp}] ${m.role === "user" ? "Anda" : "CS AI"}: ${m.content}`)
      .join("\n\n");

    await transporter.sendMail({
      from: `"CS AI Desa Sukamaju" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Histori Chat CS AI Desa Sukamaju",
      html: `<h2>Histori Chat CS AI Desa Sukamaju</h2><p>Halo <strong>${nama}</strong>,</p><p>Berikut riwayat chat Anda:</p><div style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-line;font-family:monospace;font-size:13px;">${chatText}</div><p style="margin-top:16px;color:#666;font-size:12px;">Email ini dikirim otomatis dari Portal Desa Sukamaju.</p>`,
    });

    return { status: 200, message: "Histori chat berhasil dikirim" };
  } catch (error) {
    console.error("ERROR send chat history:", error);
    return { status: 500, error: "Gagal mengirim email" };
  }
}
