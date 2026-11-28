"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "next/dist/server/api-utils";
import status from "http-status";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "../services/session";
import { toUpperCase } from "../utils/kependudukan";
import nodemailer from "nodemailer";

const SYSTEM_PROMPT = `Anda adalah CS AI Desa Sukamaju - asisten virtual untuk Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor, Jawa Barat.

INFORMASI DESA:
- Nama: Desa Sukamaju
- Kecamatan: Cibungbulang
- Kabupaten: Bogor
- Provinsi: Jawa Barat
- Alamat Kantor: Jl. KH. Abd. Hamid No.36 Cibungbulang Bogor (16630)
- Telepon/WA: +62 812-8569-9854
- Jam Layanan: Senin-Jumat, 08.00-14.00 WIB
- Kode Pos: 16630

LAYANAN ADMINISTRASI (7 jenis):
1. KTP (Kartu Tanda Penduduk) - pengajuan baru, perubahan, penggantian
2. KK (Kartu Keluarga) - pengajuan dan perubahan data
3. SKL (Surat Keterangan Kelahiran)
4. SKTM (Surat Keterangan Tidak Mampu)
5. SKK (Surat Keterangan Kematian)
6. SKU (Surat Keterangan Usaha)
7. SKD (Surat Keterangan Domisili)

BANTUAN SOSIAL (BANSOS):
- BPNT (Bantuan Pangan Non Tunai)
- BLT (Bantuan Langsung Tunai)
- PKH (Program Keluarga Harapan)
- PIP (Program Indonesia Pintar)
- BST (Bantuan Sosial Tunai)
- Untuk cek status bansos, user bisa menggunakan fitur "Cek Status Bansos" di aplikasi atau menghubungi petugas

ATURAN JAWABAN:
- Jawab dengan singkat, jelas, dan ramah dalam Bahasa Indonesia
- Jika pertanyaan tidak terkait desa atau bansos, arahkan kembali ke topik layanan desa
- Jika user butuh bantuan lebih lanjut, sarankan untuk menghubungi petugas via WhatsApp
- Jangan berikan informasi yang tidak Anda tahu pasti, sarankan hubungi kantor desa

PENTING: Jika user mengetik "cs", "chat dengan petugas", atau sudah bertanya 3-4 kali, beri respons:
"Apakah Anda ingin terhubung dengan petugas? Ketik 'y' untuk ya."`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// === AI CHAT ===
export async function aiChatAction(messages: ChatMessage[]) {
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      thinking: { type: "disabled" },
    });

    return { status: 200, reply: response.choices[0]?.message?.content || "Maaf, saya tidak dapat menjawab saat ini." };
  } catch (error) {
    console.error("ERROR AI chat:", error);
    return { status: 500, reply: "Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi petugas." };
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

    // Filter yang punya phone
    const validAgents = agents.filter(a => a.phone);

    return { status: 200, agents: validAgents };
  } catch (error) {
    console.error("ERROR get livechat agents:", error);
    return { status: 500, agents: [] };
  }
}

// === TOGGLE LIVECHAT AGENT (admin) ===
export async function toggleLivechatAgentAction(userId: string, enabled: boolean) {
  try {
    const session = await findCurrentSessionService();
    if (!session?.user || (session.user.role !== "ADMIN")) {
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
        userId: true,
        name: true,
        email: true,
        phone: true,
        jabatan: true,
        tugasPetugas: true,
        isLivechatAgent: true,
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
  email: string,
  nama: string,
  chatHistory: Array<{ role: string; content: string; timestamp: string }>
) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const chatText = chatHistory
      .map(m => `[${m.timestamp}] ${m.role === "user" ? "Anda" : "CS AI"}: ${m.content}`)
      .join("\n\n");

    const html = `
      <h2>Histori Chat CS AI Desa Sukamaju</h2>
      <p>Halo <strong>${nama}</strong>,</p>
      <p>Berikut adalah riwayat chat Anda dengan CS AI Desa Sukamaju:</p>
      <div style="background:#f5f5f5; padding:16px; border-radius:8px; white-space:pre-line; font-family:monospace; font-size:13px;">
${chatText}
      </div>
      <p style="margin-top:16px; color:#666; font-size:12px;">
        Email ini dikirim otomatis dari Portal Desa Sukamaju.<br>
        Jl. KH. Abd. Hamid No.36 Cibungbulang Bogor (16630)
      </p>
    `;

    await transporter.sendMail({
      from: `"CS AI Desa Sukamaju" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Histori Chat CS AI Desa Sukamaju",
      html,
    });

    return { status: 200, message: "Histori chat berhasil dikirim ke email Anda" };
  } catch (error) {
    console.error("ERROR send chat history:", error);
    return { status: 500, error: "Gagal mengirim email" };
  }
}
