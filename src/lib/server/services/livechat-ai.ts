import { prisma } from "@/lib/prisma";

/**
 * Livechat AI service.
 *
 * LLM dipanggil via fetch langsung ke endpoint OpenAI-compatible
 * (z.ai / Groq / OpenAI / Gemini OpenAI-compat). Tidak memakai SDK agar
 * tidak butuh file konfigurasi rahasia di repo — cukup env var di Vercel.
 *
 * Env var:
 *  LLM_BASE_URL  wajib  contoh: https://internal-api.z.ai/v1  atau  https://api.groq.com/openai/v1
 *  LLM_API_KEY   wajib  bearer key
 *  LLM_TOKEN     opsional, khusus z.ai (header X-Token). Kosongkan utk Groq/OpenAI.
 *  LLM_MODEL     opsional, nama model. Kosongkan utk pakai default endpoint.
 */

const LLM_BASE_URL = process.env.LLM_BASE_URL || "";
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_TOKEN = process.env.LLM_TOKEN || "";
const LLM_MODEL = process.env.LLM_MODEL || "";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type LivechatUserContext = {
  name: string;
  nik: string;
  detailBansos?: string | null;
};

/**
 * Ambil konteks user (nama, NIK, status bansos) untuk dimasukkan ke system prompt.
 * NIK dipakai sebagai kunci data bansos — "NIK yang dimasukkan dari awal" (saat daftar).
 */
export const getLivechatUserContext = async (userId: string): Promise<LivechatUserContext | null> => {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { name: true, nik: true, detailBansos: true },
  });
  return user ?? null;
};

const buildSystemPrompt = (user: LivechatUserContext): string => {
  const bansosBlock = user.detailBansos && user.detailBansos.trim()
    ? `Data bansos yang TERCATAT untuk NIK Anda saat ini:\n"""\n${user.detailBansos.trim()}\n"""`
    : `Belum ada data bansos yang tercatat untuk NIK Anda saat ini. Jika warga menanyakan status bansos, sampaikan bahwa belum ada data tersimpan dan sarankan mengajukan cek bansos via menu "Cek Bansos" atau menghubungi kantor desa.`;

  return `Anda adalah "Asisten Digital Desa Sukamaju" (Kec. Cibungbulang, Kab. Bogor, Jawa Barat), sebuah chatbot AI resmi yang melayani warga melalui aplikasi pelayanan desa. Jawab selalu dalam Bahasa Indonesia yang sopan, jelas, dan ringkas.

IDENTITAS PENGGUNA SAAT INI (sudah login, NIK terverifikasi saat pendaftaran):
- Nama: ${user.name}
- NIK: ${user.nik}

${bansosBlock}

LAYANAN DESA YANG TERSEDIA DI APLIKASI:
- KTP — pengajuan baru/perubahan/penggantian.
- Kartu Keluarga (KK) — pengajuan dan perubahan data.
- Surat Keterangan Kelahiran (SKL).
- Surat Keterangan Tidak Mampu (SKTM) — untuk beasiswa, keringanan, dll.
- Surat Keterangan Kematian (SKK).
- Surat Keterangan Usaha (SKU) — untuk perizinan usaha.
- Surat Keterangan Domisili (SKD).
- Cek Status Bansos — pengajuan cek status penerima bansos.
Warga dapat mengajukan sendiri via menu "Permohonan Saya" lalu memilih jenis surat; status dapat dipantau di halaman yang sama.

ATURAN MENJAWAB:
1. Jika warga bertanya status bansos mereka (contoh: "cek bansos saya", "apakah saya dapat bansos"), GUNAKAN NIK di atas — sampaikan data bansos tercatat atau belum ada. Jangan minta NIK lagi, Anda sudah memilikinya.
2. Jika warga bertanya cara mengurus surat, arahkan ke menu "Permohonan Saya" + sebut jenis surat yang sesuai. Jelaskan singkat persyaratan umum jika ditanya.
3. Jika warga bertanya hal di luar layanan desa, jawab secukupnya atau arahkan ke kantor desa. Jangan mengarang angka/kebijakan spesifik.
4. Jangan meminta data sensitif tambahan (password, nomor kartu). Anda tidak pernah memerlukan itu.
5. Jika kasus terlalu kompleks atau berupa keluhan, sarankan menghubungi kantor desa.
6. Jawab maksimal 4-5 kalimat kecuali diminta lebih detail.`;
};

/**
 * Panggil LLM via fetch. Pesan pertama harus role "system".
 * Kompatibel dengan z.ai (glm) maupun OpenAI/Groq/Gemini (OpenAI-compat).
 */
export const callLLM = async (messages: { role: string; content: string }[]): Promise<string> => {
  if (!LLM_BASE_URL || !LLM_API_KEY) {
    throw new Error("LLM belum dikonfigurasi di server. Set LLM_BASE_URL dan LLM_API_KEY (serta LLM_TOKEN untuk z.ai) pada environment variable.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LLM_API_KEY}`,
    "X-Z-AI-From": "Z",
  };
  if (LLM_TOKEN) headers["X-Token"] = LLM_TOKEN;

  const body: Record<string, unknown> = {
    messages,
    thinking: { type: "disabled" },
  };
  if (LLM_MODEL) body.model = LLM_MODEL;

  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Layanan AI merespons ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const reply: string | undefined = data?.choices?.[0]?.message?.content;
  if (!reply || !reply.trim()) {
    throw new Error("Layanan AI mengembalikan jawaban kosong. Silakan coba lagi.");
  }
  return reply.trim();
};

/**
 * Hasilkan balasan AI untuk pesan warga.
 * System prompt dibangun dari konteks user (NIK + bansos).
 * History dibatasi 10 pesan terakhir agar token tetap ringan.
 */
export const generateLivechatReply = async (
  user: LivechatUserContext,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  const messages = [
    { role: "system", content: buildSystemPrompt(user) },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];
  return callLLM(messages);
};
