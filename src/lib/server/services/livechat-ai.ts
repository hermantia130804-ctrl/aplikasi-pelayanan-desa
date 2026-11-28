import { prisma } from "@/lib/prisma";

/**
 * Livechat AI service.
 *
 * LLM dipanggil via fetch langsung ke endpoint OpenAI-compatible
 * (Groq / OpenAI / Gemini OpenAI-compat / z.ai). Tidak memakai SDK agar
 * tidak butuh file konfigurasi rahasia di repo — cukup env var di Vercel.
 *
 * Env var:
 *  LLM_BASE_URL  wajib  contoh: https://api.groq.com/openai/v1
 *  LLM_API_KEY   wajib  bearer key
 *  LLM_TOKEN     opsional, khusus z.ai (header X-Token). Kosongkan utk Groq/OpenAI.
 *  LLM_MODEL     opsional, nama model. Kosongkan utk pakai default endpoint.
 *
 * Flow livechat: saat chat dibuka, widget melakukan onboarding (tanya NAMA →
 * NIK 16 digit → email valid) satu per satu sebelum chat dimulai. NIK yang
 * dikumpulkan dipakai untuk mencari data bansos di database.
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

type StrukturItem = { nama: string; jabatan: string; urutan: number };

/**
 * Cari data bansos berdasarkan NIK yang dimasukkan user saat onboarding.
 * NIK unik di tabel User. Jika NIK terdaftar -> ambil detailBansos.
 * Jika NIK tidak terdaftar / query gagal -> null (AI menyampaikan belum ada data).
 */
export const getBansosByNik = async (nik: string): Promise<string | null> => {
  if (!nik || !/^\d{16}$/.test(nik)) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { nik },
      select: { detailBansos: true },
    });
    return user?.detailBansos ?? null;
  } catch {
    return null;
  }
};

/**
 * Ambil daftar perangkat desa (struktur organisasi) dari database.
 * Ini sumber FAKTA nama pejabat (kepala desa, sekdes, kaur, dll) agar AI
 * tidak mengarang nama saat ditanya "siapa sekdes" dll.
 * Gagal query -> return [] (chat tetap jalan, AI hanya tidak punya data pejabat).
 */
const getStrukturForPrompt = async (): Promise<StrukturItem[]> => {
  try {
    const rows = await prisma.strukturOrganisasi.findMany({
      orderBy: [{ urutan: "asc" }],
      select: { nama: true, jabatan: true, urutan: true },
    });
    return rows;
  } catch {
    return [];
  }
};

const formatStruktur = (struktur: StrukturItem[]): string => {
  if (struktur.length === 0) {
    return "Data struktur organisasi/perangkat desa belum tersedia di sistem. Jika ditanya nama pejabat desa, sampaikan bahwa data belum tersedia dan arahkan warga menghubungi kantor desa. JANGAN mengarang nama pejabat.";
  }
  return struktur
    .map((s, i) => `${i + 1}. ${s.nama} — jabatan: ${s.jabatan}`)
    .join("\n");
};

/**
 * Bangun system prompt. User selalu memberikan nama + NIK (dari onboarding),
 * jadi konteks selalu ada. Bansos dicari di DB berdasarkan NIK tersebut.
 */
const buildSystemPrompt = (user: LivechatUserContext, struktur: StrukturItem[]): string => {
  const bansosBlock =
    user.detailBansos && user.detailBansos.trim()
      ? `Data bansos yang TERCATAT di database untuk NIK ${user.nik}:\n"""\n${user.detailBansos.trim()}\n"""`
      : `Tidak ada data bansos yang tercatat di database untuk NIK ${user.nik}. Jika pengguna menanyakan status bansos, sampaikan bahwa belum ada data tersimpan untuk NIK tersebut dan sarankan mengajukan cek bansos via menu "Cek Bansos" atau menghubungi kantor desa. JANGAN mengarang status bansos.`;

  return `Anda adalah "Asisten Digital Desa Sukamaju" (Kec. Cibungbulang, Kab. Bogor, Jawa Barat), sebuah chatbot AI resmi yang melayani warga melalui aplikasi pelayanan desa. Jawab selalu dalam Bahasa Indonesia yang sopan, jelas, ringkas, dan FAKTUAL — jangan pernah mengarang fakta.

IDENTITAS PENGGUNA (dari data yang diisi pengguna di awal chat):
- Nama: ${user.name}
- NIK: ${user.nik}

${bansosBlock}

STRUKTUR ORGANISASI / PERANGKAT DESA SAAT INI (data resmi dari database desa):
${formatStruktur(struktur)}
PENTING: Jika pengguna bertanya siapa kepala desa / sekretaris desa (sekdes) / kaur / bendahara / perangkat desa lainnya, GUNAKAN daftar di atas. JANGAN mengarang nama yang tidak ada di daftar.

LAYANAN DESA YANG TERSEDIA DI APLIKASI:
- KTP, Kartu Keluarga (KK), Surat Keterangan Kelahiran (SKL), Surat Keterangan Tidak Mampu (SKTM), Surat Keterangan Kematian (SKK), Surat Keterangan Usaha (SKU), Surat Keterangan Domisili (SKD), dan Cek Status Bansos.
Warga dapat mengajukan sendiri via menu "Permohonan Saya" lalu memilih jenis surat; status dapat dipantau di halaman yang sama.

ATURAN MENJAWAB (WAJIB DIIKUTI):
1. Cek bansos: GUNAKAN NIK pengguna di data di atas. Jika detailBansos ada, sebutkan isinya. Jika tidak ada, sampaikan belum ada data tersimpan untuk NIK tersebut + sarankan ajukan cek bansos / hubungi kantor desa. Jangan mengarang status bansos.
2. Cara mengurus surat: arahkan ke menu "Permohonan Saya" + sebut jenis surat yang sesuai.
3. Pertanyaan faktual tentang desa (nama pejabat, struktur, layanan): GUNAKAN data di atas. Jika data tidak ada di atas, jawab JUJUR: "Saya tidak memiliki data tersebut, silakan hubungi kantor desa." DILARANG mengarang nama, nomor telepon, tanggal, angka, atau kebijakan yang tidak ada di data.
4. Jangan meminta data sensitif tambahan (password, nomor kartu, OTP). Anda tidak pernah memerlukan itu.
5. Bantu JAWAB semua pertanyaan pengguna seputar layanan desa, surat, bansos, prosedur, dan info umum desa. Jika kasus terlalu kompleks atau berupa keluhan, sarankan menghubungi kantor desa.
6. Jawab maksimal 4-5 kalimat kecuali diminta lebih detail.`;
};

/**
 * Panggil LLM via fetch. Pesan pertama harus role "system".
 * Kompatibel dengan Groq / OpenAI / Gemini (OpenAI-compat) maupun z.ai (glm).
 *
 * CATATAN: properti `thinking` HANYA didukung z.ai. Groq/OpenAI/Gemini akan
 * menolak dengan error 400 "property 'thinking' is unsupported". Jadi properti
 * ini hanya dikirim bila endpoint adalah z.ai.
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

  const body: Record<string, unknown> = { messages };
  if (LLM_MODEL) body.model = LLM_MODEL;
  // `thinking` hanya untuk z.ai (glm). Groq/OpenAI/Gemini menolak properti ini (400).
  if (LLM_BASE_URL.includes("z.ai")) body.thinking = { type: "disabled" };

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
 * System prompt dibangun dari konteks user (nama + NIK dari onboarding +
 * detailBansos hasil lookup NIK di DB) + struktur organisasi desa (nama
 * pejabat) agar AI menjawab faktual, bukan mengarang.
 * History dibatasi 10 pesan terakhir agar token tetap ringan.
 */
export const generateLivechatReply = async (
  user: LivechatUserContext,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  const struktur = await getStrukturForPrompt();
  const messages = [
    { role: "system", content: buildSystemPrompt(user, struktur) },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];
  return callLLM(messages);
};
