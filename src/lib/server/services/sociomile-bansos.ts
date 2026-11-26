// Service: ambil detail bansos otomatis dari chatbot Kemensos (MINSOS) via REST Sociomile.
// Protokol dikonfirmasi via capture live widget (26 Nov 2026).
//
// Flow:
//   1. POST /talk2bot message="cek bansos"  -> bot balas "silakan input 16 digit NIK"
//   2. POST /talk2bot message=<NIK>          -> bot balas detail bansos (atau "NIK salah")
//
// Endpoint: POST https://superchat.sociomile.net/talk2bot (application/x-www-form-urlencoded)
// Response: { status, messages: [{ type, text, callback_id }] }

const ROOM_ID = "6abd3eb90de3aa91408eb350";
const ENDPOINT = "https://superchat.sociomile.net/talk2bot";
const USER_NAME = "herman";
const USER_PHONE = "6285772646402";
const PREV_QUESTION = "ask_name";
const TRIGGER = "cek bansos";

function genUserId(): string {
  return `${Math.floor(Math.random() * 1000000)}_${ROOM_ID}`;
}

async function postTalk2bot(userId: string, message: string, retries = 2, delayMs = 2000): Promise<string> {
  const buildBody = () => new URLSearchParams({
    id: ROOM_ID,
    driver: "web",
    userId,
    message,
    question: "",
    attachment: "",
    interactive: "0",
    prev_question: PREV_QUESTION,
    timestamp: String(Math.floor(Date.now() / 1000)),
    user_name: USER_NAME,
    user_phone: USER_PHONE,
    timezone: "UTC",
  }).toString();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildBody(),
    });
    if (!res.ok) throw new Error(`Sociomile HTTP ${res.status}`);
    const json: any = await res.json();
    if (Array.isArray(json?.messages) && json.messages.length > 0) {
      return json.messages.map((m: any) => m.text).join("\n");
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, delayMs));
    } else {
      throw new Error("Sociomile tidak memberikan balasan setelah " + retries + " percobaan.");
    }
  }
  throw new Error("Tidak terjangkau");
}

export async function fetchDetailBansosByNik(nik: string): Promise<string> {
  if (!/^\d{16}$/.test(nik || "")) {
    throw new Error("NIK harus 16 digit angka.");
  }
  const userId = genUserId();
  // Langkah 1: trigger "cek bansos" (bot akan minta NIK)
  await postTalk2bot(userId, TRIGGER);
  // Langkah 2: kirim NIK, terima detail
  const detail = await postTalk2bot(userId, nik);
  if (/nik.*(salah|tidak valid|tidak ditemukan)|input.*16.*digit.*nik/i.test(detail)) {
    throw new Error("NIK ditolak bot (salah/tidak ditemukan di database Kemensos).");
  }
  return detail;
}
