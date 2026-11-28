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

const SYSTEM_PROMPT = `Anda adalah "CS AI Desa Sukamaju" — asisten virtual ramah untuk Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor.

INFO DESA:
- Alamat: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630
- Telepon/WA: +62 812-8569-9854
- Jam: Senin-Jumat 08.00-14.00 WIB

LAYANAN (7 surat): KTP, KK, SKL(kelahiran), SKTM(tidak mampu), SKK(kematian), SKU(usaha), SKD(domisili).
Setiap pengajuan: login → pilih layanan → isi data → upload dokumen (PDF/foto) → kirim.

BANSOS: BPNT, BLT, PKH, PIP, BST. Cek via menu Cek Status Bansos di aplikasi.

ATURAN: Jawab Bahasa Indonesia, singkat, ramah, fleksibel. Bisa jawab pertanyaan umum. Jika perlu petugas, sarankan ketik "cs".`;

// === Smart fallback knowledge base ===
function smartFallback(userText: string): string {
  const t = userText.toLowerCase();

  // KTP
  if (/ktp|tanda penduduk|identitas/.test(t)) {
    if (/lama|berapa|estimasi|waktu|proses|selesai/.test(t))
      return "Estimasi proses KTP: 3-5 hari kerja setelah verifikasi petugas. Status bisa dicek di menu Permohonan Saya.";
    if (/syarat|dokumen|berkas|persyaratan/.test(t))
      return "Dokumen KTP: scan Kartu Keluarga + Surat Pengantar RT/RW. Bisa PDF atau foto dari kamera HP.";
    if (/cara|gimana|bagaimana|buat|ajukan/.test(t))
      return "Cara ajukan KTP:\n1. Login ke aplikasi\n2. Klik menu Ajukan KTP\n3. Pilih jenis (baru/perubahan/penggantian)\n4. Isi data diri\n5. Upload KK + surat pengantar\n6. Klik Kirim Permohonan\n\nBiaya: GRATIS. Estimasi: 3-5 hari kerja.";
    return "Untuk KTP, Anda bisa ajukan via aplikasi: menu Ajukan KTP. Ada 3 jenis: Baru, Perubahan, Penggantian. Dokumen: KK + surat pengantar RT/RW. Tanya lebih spesifik (cara, syarat, lama proses) atau ketik 'cs' untuk petugas.";
  }

  // KK
  if (/kartu keluarga|\bkk\b/.test(t)) {
    if (/syarat|dokumen/.test(t))
      return "Dokumen KK: KTP kepala keluarga + akta kelahiran + surat pengantar RT/RW.";
    return "Cara ajuan KK: login → Ajukan KK → isi data kepala keluarga + anggota → upload KTP + akta + pengantar → kirim. Biaya: GRATIS.";
  }

  // Bansos
  if (/bansos|bantuan|blt|pkh|bpnt|pip|sembako/.test(t)) {
    if (/cek|status|lihat/.test(t))
      return "Cek bansos:\n1. Login → menu Cek Status Bansos\n2. Klik Buka Sociomile\n3. Kirim 'cek bansos'\n4. Masukkan NIK\n5. Copy hasil → paste di aplikasi → simpan";
    return "Jenis bansos: BPNT, BLT, PKH, PIP, BST.\nUntuk cek status: menu Cek Status Bansos → Sociomile → masukkan NIK.\nKetik 'cs' untuk hubungi petugas bansos.";
  }

  // Jam/lokasi/kontak
  if (/jam|buka|layanan/.test(t))
    return "Jam layanan: Senin-Jumat, 08.00-14.00 WIB. Pengajuan online: 24 jam via aplikasi.";
  if (/alamat|lokasi|kantor|dimana|peta/.test(t))
    return "Kantor Desa Sukamaju: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630. Telepon/WA: +62 812-8569-9854.";
  if (/telepon|kontak|wa|whatsapp|hubungi|nomor/.test(t))
    return "Telepon/WA desa: +62 812-8569-9854. Atau ketik 'cs' untuk hubungi petugas langsung via WhatsApp.";

  // Salam
  if (/halo|hai|hello|hi|pagi|siang|sore|malam|assalam/.test(t))
    return "Halo! 👋 Selamat datang di CS AI Desa Sukamaju.\nSaya bisa bantu seputar: KTP, KK, SKL, SKTM, SKK, SKU, SKD, bansos, cara pakai aplikasi, jam layanan, lokasi desa.\n\nSilakan bertanya!";

  // Terima kasih
  if (/terima kasih|makasih|thanks|suwun|oke|sip/.test(t))
    return "Sama-sama! 😊 Ada lagi yang bisa saya bantu? Ketik 'cs' untuk hubungi petugas.";

  // Upload
  if (/upload|unggah|dokumen|file|kamera/.test(t))
    return "Upload dokumen: PDF/JPG/PNG/WebP. Klik area upload → pilih file atau ambil foto dari kamera. Gambar auto-kompres. Maks 9MB.";

  // Daftar
  if (/daftar|registrasi|akun|login|masuk|sign up/.test(t))
    return "Cara daftar: klik Masuk/Daftar → tab Daftar → isi nama, NIK, email, password → upload selfie → verifikasi email. Admin akan aktivasi akun Anda.";

  // Default
  return "Saya bisa bantu dengan topik ini:\n📋 Layanan: KTP, KK, SKL, SKTM, SKK, SKU, SKD\n🤝 Bansos\n📱 Cara pakai aplikasi\n📍 Lokasi & jam layanan\n📞 Kontak\n\nTanya lebih spesifik ya, atau ketik 'cs' untuk petugas.";
}

// === AI CHAT — Z.ai API + smart fallback ===
export async function aiChatAction(messages: ChatMessage[]) {
  try {
    const apiKey = process.env.ZAI_API_KEY;

    // Coba Z.ai API jika ada key
    if (apiKey) {
      try {
        const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "glm-4.5-air",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            // Cek apakah AI menyarankan petugas
            if (reply.includes("PETUGAS_PROMPT") || reply.toLowerCase().includes("hubungi petugas")) {
              return { status: 200, reply: reply.replace("PETUGAS_PROMPT", "").trim(), isPetugasRequest: true };
            }
            return { status: 200, reply };
          }
        }
        // Jika API gagal (saldo/error), lanjut ke fallback
        console.log("Z.ai API gagal, gunakan fallback:", response.status);
      } catch (apiError) {
        console.log("Z.ai API error, gunakan fallback:", apiError);
      }
    }

    // Fallback: smart knowledge base
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return { status: 200, reply: "Silakan bertanya." };

    const lower = lastUserMsg.content.toLowerCase().trim();
    if (["cs", "chat dengan petugas", "chat petugas", "petugas"].includes(lower)) {
      return { status: 200, reply: "PETUGAS_PROMPT", isPetugasRequest: true };
    }

    return { status: 200, reply: smartFallback(lastUserMsg.content) };
  } catch (error) {
    console.error("ERROR AI chat:", error);
    return { status: 200, reply: "Maaf, ada gangguan. Ketik 'cs' untuk hubungi petugas." };
  }
}

// === GET LIVECHAT AGENTS ===
export async function getLivechatAgentsAction() {
  try {
    const agents = await prisma.user.findMany({
      where: { isLivechatAgent: true, status: "ACTIVE", role: "PETUGAS" },
      select: { userId: true, name: true, phone: true, jabatan: true, tugasPetugas: true },
    });
    return { status: 200, agents: agents.filter(a => a.phone) };
  } catch {
    return { status: 200, agents: [] };
  }
}

// === TOGGLE LIVECHAT AGENT ===
export async function toggleLivechatAgentAction(userId: string, enabled: boolean) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user || session.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin.");
    await prisma.user.update({ where: { userId }, data: { isLivechatAgent: enabled } });
    revalidatePath("/livechat-settings");
    return { status: 200, message: `Petugas ${enabled ? "ditambahkan" : "dihapus"} dari livechat` };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    return { status: 500, error: "Terjadi kesalahan" };
  }
}

// === GET ALL PETUGAS ===
export async function getAllPetugasAction() {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user || session.user.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Hanya admin.");
    const petugas = await prisma.user.findMany({
      where: { role: "PETUGAS", status: "ACTIVE" },
      select: { userId: true, name: true, email: true, phone: true, jabatan: true, tugasPetugas: true, isLivechatAgent: true },
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
    // Validasi email punya domain
    if (!email || !email.includes("@") || !email.includes(".")) {
      return { status: 400, error: "Email tidak valid" };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const chatText = chatHistory.map(m => `[${m.timestamp}] ${m.role === "user" ? "Anda" : "CS AI"}: ${m.content}`).join("\n\n");

    await transporter.sendMail({
      from: `"CS AI Desa Sukamaju" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Histori Chat CS AI Desa Sukamaju",
      html: `<h2>Histori Chat CS AI Desa Sukamaju</h2>
<p>Halo <strong>${nama}</strong>,</p>
<p>Berikut riwayat chat Anda:</p>
<div style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-line;font-family:monospace;font-size:13px;">${chatText}</div>
<p style="margin-top:16px;color:#666;font-size:12px;">Email otomatis dari Portal Desa Sukamaju.</p>`,
    });

    return { status: 200, message: "Histori chat berhasil dikirim ke " + email };
  } catch (error) {
    console.error("ERROR send email:", error);
    return { status: 500, error: "Gagal mengirim email: " + (error instanceof Error ? error.message : "unknown") };
  }
}
