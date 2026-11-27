#!/usr/bin/env node
/**
 * sociomile-bansos-client.js — ambil DETAIL BANSOS otomatis dari chatbot Kemensos (MINSOS)
 * via REST API Sociomile. PROTOKOL DIKONFIRMASI via capture live (26 Nov 2026).
 *
 * Flow (replicasi manual Anda, tapi otomatis):
 *   1. POST /talk2bot message="cek bansos"  -> bot balas "silakan input 16 digit NIK"
 *   2. POST /talk2bot message=<NIK>          -> bot balas detail bansos (atau "NIK salah")
 *   3. return teks detail -> siap simpan ke User.detailBansos / tampil di UI.
 *
 * PROTOKOL (dari capture network widget):
 *   POST https://superchat.sociomile.net/talk2bot
 *   Content-Type: application/x-www-form-urlencoded
 *   Body: id=<roomId>&driver=web&userId=<rand6>_<roomId>&message=<text>
 *         &question=&attachment=&interactive=0&prev_question=ask_name
 *         &timestamp=<unix>&user_name=<nama>&user_phone=<phone>&timezone=UTC
 *   Response JSON: { status:200, messages:[{ type:"text", text:"...", callback_id:"..." }] }
 *   userId disimpan widget di localStorage key <roomId>-sociomile_chatbot_userBotId.
 *
 * Pakai (validasi lokal dgn NIK asli):
 *   node sociomile-bansos-client.js <NIK_16_DIGIT>
 *   contoh: node sociomile-bansos-client.js 3201234567890001
 *
 * Butuh Node >= 18 (pakai global fetch). Tidak butuh dependency tambahan.
 */

const ROOM_ID = "6abd3eb90de3aa91408eb350";
const ENDPOINT = "https://superchat.sociomile.net/talk2bot";
const USER_NAME = "herman";         // dari param wbia widget
const USER_PHONE = "6285772646402";  // dari param wbia widget
const TIMEZONE = "UTC";
const PREV_QUESTION = "ask_name";    // state bot (diamati konsisten di 2 request capture)
const TRIGGER = "cek bansos";

function genUserId() {
  const rand = Math.floor(Math.random() * 1000000);
  return `${rand}_${ROOM_ID}`;
}

async function postTalk2bot({ userId, message, retries = 3, delayMs = 2000 }) {
  const params = new URLSearchParams({
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
    timezone: TIMEZONE,
  });
  // Bot kadang butuh waktu commit state server-side; retry kalau messages kosong.
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} dari ${ENDPOINT}`);
    const json = await res.json();
    if (json && Array.isArray(json.messages) && json.messages.length > 0) {
      return json.messages.map((m) => m.text).join("\n");
    }
    // messages kosong — tunggu + retry
    if (attempt < retries) {
      console.log(`      (retry ${attempt + 1}/${retries} — messages kosong, tunggu ${delayMs}ms)`);
      await new Promise((r) => setTimeout(r, delayMs));
      params.set("timestamp", String(Math.floor(Date.now() / 1000)));
    } else {
      throw new Error("Response messages kosong setelah " + retries + " retry: " + JSON.stringify(json).slice(0, 200));
    }
  }
}

function isNikRejected(text) {
  // Bot balas "Nomor NIK yang Anda input salah, silakan input 16 digit NIK Anda:" kalau invalid.
  return /nik.*(salah|tidak valid|tidak ditemukan)|input.*16.*digit.*nik/i.test(text);
}

async function getDetailBansos(nik, { userId } = {}) {
  if (!/^\d{16}$/.test(nik || "")) {
    throw new Error("NIK harus 16 digit angka. Diterima: " + nik);
  }
  const uid = userId || genUserId();

  // Langkah 1: trigger "cek bansos"
  const reply1 = await postTalk2bot({ userId: uid, message: TRIGGER });
  console.log(`[1/2] bot (setelah "cek bansos"): ${reply1}`);
  if (!/nik/i.test(reply1)) {
    console.warn("      (!) Bot tidak minta NIK — mungkin offline/queue. Tetap mencoba kirim NIK...");
  }

  // Selang 2 detik sebelum kirim NIK (sesuai flow manual yang diminta).
  console.log("      (menunggu 2 detik sebelum kirim NIK...)");
  await new Promise((r) => setTimeout(r, 2000));

  // Langkah 2: kirim NIK
  const reply2 = await postTalk2bot({ userId: uid, message: nik });
  console.log(`[2/2] bot (setelah NIK): ${reply2}`);

  if (isNikRejected(reply2)) {
    throw new Error("Bot menolak NIK (salah/tidak ditemukan). Cek NIK: " + nik);
  }
  return reply2;
}

// ---------- CLI ----------
if (require.main === module) {
  const nik = process.argv[2];
  if (!nik) {
    console.error("Pakai: node sociomile-bansos-client.js <NIK_16_DIGIT>");
    console.error("Contoh: node sociomile-bansos-client.js 3201234567890001");
    process.exit(1);
  }
  getDetailBansos(nik)
    .then((detail) => {
      console.log("\n=== DETAIL BANSOS ===");
      console.log(detail);
      console.log("\n(Siap simpan ke User.detailBansos / tampil otomatis di UI.)");
      process.exit(0);
    })
    .catch((e) => {
      console.error("\nx GAGAL:", e.message);
      process.exit(1);
    });
}

module.exports = { getDetailBansos, postTalk2bot, ROOM_ID, ENDPOINT };
