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

// System prompt — AI memahami program desa + bisa jawab pertanyaan umum
const SYSTEM_PROMPT = `Anda adalah "CS AI Desa Sukamaju" — asisten virtual ramah untuk Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor, Jawa Barat.

INFORMASI DESA:
- Nama: Desa Sukamaju
- Alamat: Jl. KH. Abd. Hamid No.36, Cibungbulang, Kab. Bogor 16630
- Telepon/WA: +62 812-8569-9854
- Jam Layanan: Senin-Jumat 08.00-14.00 WIB
- Kode Pos: 16630
- RW: 8, RT: 24

LAYANAN APLIKASI (7 jenis surat):
1. KTP — pengajuan baru/perubahan/penggantian. Dokumen: scan KK + surat pengantar RT/RW. Bisa PDF atau foto.
2. KK — pengajuan/perubahan. Dokumen: KTP + akta + pengantar.
3. SKL (Kelahiran) — dokumen: KK + pengantar + surat lahir RS/bidan.
4. SKTM (Tidak Mampu) — dokumen: KK + KTP + pengantar. Untuk beasiswa/rs/bansos.
5. SKK (Kematian) — tanpa upload dokumen, diverifikasi petugas.
6. SKU (Usaha) — dokumen: KK + KTP + pengantar + bukti usaha. Untuk NIB/BPOM/rekening bisnis.
7. SKD (Domisili) — dokumen: KK + KTP + pengantar.

FITUR APLIKASI:
- Login/Daftar: isi nama, NIK, email, password, selfie. Verifikasi via email.
- Cek Status Bansos: klik link Sociomile → kirim "cek bansos" → masukkan NIK → copy hasil → paste di aplikasi.
- Kelola Data Warga: input penduduk (tetap + sementara) + kejadian (lahir/mati/pindah/datang). Import Excel.
- Foto Kepala Keluarga: avatar bulat di grup KK, ambil dari kamera/galeri.
- Lampid Bulanan: laporan penduduk per RW/RT, export Excel & print.
- Laporan Usia: distribusi penduduk per kelompok umur.
- Upload dokumen: PDF/JPG/PNG/WebP, bisa dari kamera HP, auto-kompres, edit rotate.
- Auto-fill KTP: warga 19+ tahun otomatis status KTP = PUNYA.

BANTUAN SOSIAL:
- BPNT (Bantuan Pangan), BLT (Tunai), PKH (Keluarga Harapan), PIP (Pendidikan), BST.
- Cek via Sociomile atau ketik "cs" untuk hubungi petugas.

ATURAN JAWABAN:
- Jawab dalam Bahasa Indonesia, singkat, jelas, ramah, dan FLEXIBEL sesuai pertanyaan user.
- Bisa jawab pertanyaan umum (sapaan, terima kasih, dll).
- Jika ditanya di luar topik desa, jawab dengan ramah lalu arahkan ke layanan desa.
- Jika user butuh bantuan lebih lanjut, sarankan ketik "cs" untuk hubungi petugas via WhatsApp.
- Jangan bilang "saya tidak tahu" — selalu berikan jawaban yang membantu atau arahkan ke petugas.
- Jika user mengetik "cs", "chat dengan petugas", "petugas" — balas dengan: PETUGAS_PROMPT`;

// === AI CHAT — Z.ai API asli ===
export async function aiChatAction(messages: ChatMessage[]) {
  try {
    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey) {
      return { status: 200, reply: "Maaf, layanan AI belum dikonfigurasi. Silakan ketik 'cs' untuk hubungi petugas." };
    }

    const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
            .filter(m => m.role !== "system")
            .map(m => ({ role: m.role, content: m.content })),
        ],
        thinking: { type: "disabled" },
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Z.ai API error:", response.status, errText);
      return { status: 200, reply: "Maaf, ada gangguan koneksi. Silakan coba lagi atau ketik 'cs' untuk hubungi petugas." };
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "Maaf, saya tidak bisa menjawab saat ini.";

    // Cek apakah AI menyarankan petugas
    if (reply.includes("PETUGAS_PROMPT")) {
      reply = reply.replace("PETUGAS_PROMPT", "").trim();
      return { status: 200, reply: reply || "Apakah Anda ingin terhubung dengan petugas?", isPetugasRequest: true };
    }

    return { status: 200, reply };
  } catch (error) {
    console.error("ERROR AI chat:", error);
    return { status: 200, reply: "Maaf, koneksi bermasalah. Ketik 'cs' untuk hubungi petugas langsung via WhatsApp." };
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
  } catch (error) {
    console.error("ERROR get agents:", error);
    return { status: 200, agents: [] };
  }
}

// === TOGGLE LIVECHAT AGENT ===
export async function toggleLivechatAgentAction(userId: string, enabled: boolean) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new ApiError(status.FORBIDDEN, "Hanya admin.");
    }
    await prisma.user.update({ where: { userId }, data: { isLivechatAgent: enabled } });
    revalidatePath("/livechat-settings");
    return { status: 200, message: `Petugas ${enabled ? "ditambahkan ke" : "dihapus dari"} livechat` };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.statusCode, error: error.message };
    return { status: 500, error: "Terjadi kesalahan" };
  }
}

// === GET ALL PETUGAS ===
export async function getAllPetugasAction() {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new ApiError(status.FORBIDDEN, "Hanya admin.");
    }
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
      html: `<h2>Histori Chat CS AI Desa Sukamaju</h2><p>Halo <strong>${nama}</strong>,</p><p>Berikut riwayat chat Anda:</p><div style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-line;font-family:monospace;font-size:13px;">${chatText}</div><p style="margin-top:16px;color:#666;font-size:12px;">Email ini dikirim otomatis dari Portal Desa Sukamaju.</p>`,
    });
    return { status: 200, message: "Histori chat berhasil dikirim" };
  } catch (error) {
    console.error("ERROR send email:", error);
    return { status: 500, error: "Gagal mengirim email" };
  }
}
