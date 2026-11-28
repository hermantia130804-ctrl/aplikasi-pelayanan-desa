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

type StrukturItem = { nama: string; jabatan: string; urutan: number };

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

/**
 * Ambil daftar perangkat desa (struktur organisasi) dari database.
 * Ini sumber FAKTA nama pejabat (kepala desa, sekdes, kaur, dll) agar AI
 * tidak mengarang nama saat ditanya "siapa sekdes" dll.
 * Gagal query -> return [] (chat tetap jalan, AI hanya tidak punya data pejabat).
 */
const getStrukturForPrompt = async (): Promise<StrukturItem[]> => {
  try {
    const rows = await prisma.strukturOrganisasi.findMany({
      orderBy: [{ tingkat: "asc" }, { urutan: "asc" }],
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

const buildSystemPrompt = (user: LivechatUserContext | null, struktur: StrukturItem[]): string => {
  const identitasBlock = user
    ? `IDENTITAS PENGGUNA SAAT INI (sudah login, NIK terverifikasi saat pendaftaran):\n- Nama: ${user.name}\n- NIK: ${user.nik}`
    : `PENGGUNA SAAT INI: tamu/pengunjung yang BELUM LOGIN. Anda tidak mengetahui identitas atau NIK pengguna.`;

  const bansosBlock = user
    ? (user.detailBansos && user.detailBansos.trim()
      ? `Data bansos yang TERCATAT untuk NIK pengguna saat ini:\n"""\n${user.detailBansos.trim()}\n"""`
      : `Belum ada data bansos yang tercatat untuk NIK pengguna. Jika ditanya status bansos, sampaikan belum ada data tersimpan dan sarankan mengajukan cek bansos via menu "Cek Bansos" atau menghubungi kantor desa.`)
    : `Pengguna belum login, jadi Anda TIDAK punya data bansos pribadinya. Jika pengguna menanyakan "cek bansos saya" atau status bansos pribadinya, arahkan untuk MASUK (login) dulu via menu "Masuk" agar sistem dapat memeriksa NIK terdaftar. DILARANG mengarang status bansos.`;

  return `Anda adalah "Asisten Digital Desa Sukamaju" (Kec. Cibungbulang, Kab. Bogor, Jawa Barat), sebuah chatbot AI resmi yang melayani warga melalui aplikasi pelayanan desa. Jawab selalu dalam Bahasa Indonesia yang sopan, jelas, ringkas, dan FAKTUAL — jangan pernah mengarang fakta.

${identitasBlock}

${bansosBlock}

STRUKTUR ORGANISASI / PERANGKAT DESA SAAT INI (data resmi dari database desa):
${formatStruktur(struktur)}
PENTING: Jika pengguna bertanya siapa kepala desa / sekretaris desa (sekdes) / kaur / bendahara / perangkat desa lainnya, GUNAKAN daftar di atas. JANGAN mengarang nama yang tidak ada di daftar.

LAYANAN DESA YANG TERSEDIA DI APLIKASI:
- KTP, Kartu Keluarga (KK), Surat Keterangan Kelahiran (SKL), Surat Keterangan Tidak Mampu (SKTM), Surat Keterangan Kematian (SKK), Surat Keterangan Usaha (SKU), Surat Keterangan Domisili (SKD), dan Cek Status Bansos.
Warga dapat mengajukan sendiri via menu "Permohonan Saya" lalu memilih jenis surat; status dapat dipantau di halaman yang sama.

ATURAN MENJAWAB (WAJIB DIIKUTI):
1. Cek bansos: bila pengguna SUDAH login, GUNAKAN NIK di data + data bansos tercatat (jangan minta NIK lagi). bila BELUM login, arahkan MASUK dulu via menu "Masuk". Jangan mengarang status bansos.
2. Cara mengurus surat: arahkan ke menu "Permohonan Saya" + sebut jenis surat yang sesuai.
3. Pertanyaan faktual tentang desa (nama pejabat, struktur, layanan): GUNAKAN data di atas. Jika data tidak ada di atas, jawab JUJUR: "Saya tidak memiliki data tersebut, silakan hubungi kantor desa." DILARANG mengarang nama, nomor telepon, tanggal, angka, atau kebijakan yang tidak ada di data.
4. Jangan meminta data sensitif tambahan (password, nomor kartu, OTP). Anda tidak pernah memerlukan itu.
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
 * System prompt dibangun dari konteks user (NIK + bansos) + struktur organisasi
 * desa (nama pejabat) agar AI menjawab faktual, bukan mengarang.
 * - user != null: pengguna sudah login -> prompt personal (NIK + bansos).
 * - user == null: tamu belum login -> prompt umum (struktur + layanan); bila
 *   ditanya bansos pribadi, AI arahkan login dulu.
 * History dibatasi 10 pesan terakhir agar token tetap ringan.
 */
export const generateLivechatReply = async (
  user: LivechatUserContext | null,
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
