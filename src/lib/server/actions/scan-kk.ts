"use server";

import { findCurrentSessionService } from "../services/session";
import { rateLimit } from "../utils/rate-limit";

const SYSTEM_PROMPT = `Kamu adalah AI OCR spesialis untuk membaca Kartu Keluarga (KK) Indonesia.

Baca gambar KK Indonesia dan kembalikan data JSON EXACTLY sesuai schema.

LAYOUT KK INDONESIA:
BAGIAN HEADER: NO. KK, NAMA KEPALA KELUARGA, ALAMAT, RT/RW, KEL/DESA, KECAMATAN, KABUPATEN/KOTA, PROVINSI, NAMA AYAH, NAMA IBU.
BAGIAN TABEL: NO, NIK, NAMA, JK, TEMPAT LAHIR, TANGGAL LAHIR (DD-MM-YYYY -> YYYY-MM-DD), AGAMA, PENDIDIKAN, PEKERJAAN, STATUS PERKAWINAN, STATUS HUBUNGAN DALAM KELUARGA, KEWARGANEGARAAN.

NILAI VALID:
- Agama: ISLAM, KRISTEN, BUDHA, HINDU, LAINNYA
- Pendidikan: TIDAK/BELUM SEKOLAH, BELUM TAMAT SD/SEDERAJAT, TIDAK TAMAT SD/SEDERAJAT, SD/SEDERAJAT, SMP/SEDERAJAT, SMA/SEDERAJAT, PAKET A, PAKET B, PAKET C, SLB, D1, D2, D3, S1, S2, S3
- Pekerjaan: PELAJAR/MAHASISWA, PNS, SOPIR, USTADZ/MUBALIGH, PEDAGANG, BELUM/TIDAK BEKERJA, BURUH HARIAN LEPAS, MENGURUS RUMAH TANGGA, WIRASWASTA, PEGAWAI ASN, KARYAWAN SWASTA, TNI, POLRI
- Status Perkawinan: BELUM MENIKAH, KAWIN, CERAI HIDUP, CERAI MATI
- Status Keluarga: KEPALA KELUARGA, ISTRI, ANAK, MERTUA, MENANTU, CUCU, LAINNYA

KEMBALIKAN HANYA JSON.`;

const MODELS_FALLBACK = ["gemini-flash-lite-latest", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash"];

// (#12) Batas ukuran gambar: 5 MB setelah decode (base64 ~6.7M char).
// Cegah upload gambar raksasa yang burn Gemini quota / DoS billing.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Base64 memakai ~4/3 x ukuran biner.
const MAX_BASE64_LEN = Math.ceil(MAX_IMAGE_BYTES * 4 / 3);
// Rate limit per user: 10 scan / jam. Cegah spam panggilan Gemini.
const SCAN_LIMIT = 10;
const SCAN_WINDOW_MS = 60 * 60 * 1000;

export async function scanKKAction(imageDataUrl: string) {
  try {
    // (#12) Auth: wajib login. Sebelumnya siapapun (bahkan tanpa sesi) bisa
    // panggil endpoint ini dan burn Gemini API quota.
    const session = await findCurrentSessionService();
    if (!session?.user) {
      return { ok: false, error: "Anda harus login untuk menggunakan fitur scan KK." };
    }

    // (#12) Rate limit per user.
    const rlKey = `scan-kk:user:${session.user.userId}`;
    const rl = rateLimit(rlKey, SCAN_LIMIT, SCAN_WINDOW_MS);
    if (!rl.allowed) {
      const retryMin = Math.max(1, Math.ceil(rl.retryAfterMs / 60000));
      return { ok: false, error: `Batas scan KK tercapai (${SCAN_LIMIT}/jam). Coba lagi dalam ${retryMin} menit.` };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, error: "GEMINI_API_KEY belum diset di server." };
    if (!imageDataUrl?.startsWith("data:image/")) {
      return { ok: false, error: "Gambar tidak valid." };
    }

    // (#12) Size limit: tolak gambar melebihi MAX_IMAGE_BYTES.
    const commaIdx = imageDataUrl.indexOf(",");
    const base64 = commaIdx >= 0 ? imageDataUrl.slice(commaIdx + 1) : "";
    if (base64.length > MAX_BASE64_LEN) {
      return { ok: false, error: `Ukuran gambar melebihi ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB. Kompres dulu lalu coba lagi.` };
    }

    const meta = imageDataUrl.slice(0, commaIdx);
    const mimeType = meta.match(/data:(image\/[\w.]+);/)?.[1] ?? "image/jpeg";

    let lastErrText = "";
    let result: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null = null;
    let modelTerpakai = "";

    for (const model of MODELS_FALLBACK) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [{ role: "user", parts: [
                { text: "Baca Kartu Keluarga ini dengan teliti. Kembalikan JSON saja." },
                { inlineData: { mimeType, data: base64 } },
              ]}],
              generationConfig: { temperature: 0.05, thinkingConfig: { thinkingBudget: 1024 } },
            }),
            signal: AbortSignal.timeout(50000),
          }
        );
        if (res.ok) { result = await res.json(); modelTerpakai = model; break; }
        lastErrText = `${res.status}: ${(await res.text()).substring(0, 100)}`;
        console.error(`GEMINI [${model}] gagal: ${lastErrText}`);
      } catch (e) {
        lastErrText = e instanceof Error ? e.message : String(e);
        console.error(`GEMINI [${model}] error: ${lastErrText}`);
      }
    }

    if (!result) {
      console.error("GEMINI ERROR (semua model):", lastErrText);
      return { ok: false, error: "AI sedang sibuk. Coba lagi beberapa saat." };
    }
    console.log("GEMINI model terpakai:", modelTerpakai);

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("GEMINI raw (400 char):", text.substring(0, 400));
    if (!text) return { ok: false, error: "AI tidak mengembalikan respons." };

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\w*\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(cleaned); }
    catch (e) { return { ok: false, error: "AI response tidak valid: " + (e instanceof Error ? e.message : "parse error") }; }

    // ===== Normalisasi field: terima snake_case / camelCase dari AI =====
    const anggotaRaw = parsed.anggota_keluarga ?? parsed.anggota ?? parsed.anggotaKeluarga ?? [];
    const mapAnggota = (a: Record<string, unknown>) => ({
        nik: String(a.nik ?? ""),
        namaLengkap: String(a.nama_lengkap ?? a.namaLengkap ?? a.nama ?? ""),
        jenisKelamin: String(a.jenis_kelamin ?? a.jenisKelamin ?? a.jk ?? ""),
        tempatLahir: String(a.tempat_lahir ?? a.tempatLahir ?? ""),
        tanggalLahir: String(a.tanggal_lahir ?? a.tanggalLahir ?? ""),
        agama: String(a.agama ?? ""),
        pendidikan: String(a.pendidikan ?? ""),
        pekerjaan: String(a.pekerjaan ?? a.jenis_pekerjaan ?? a.nama_pekerjaan ?? ""),
        statusPerkawinan: String(a.status_perkawinan ?? a.statusPerkawinan ?? ""),
        statusKeluarga: String(a.status_hubungan ?? a.status_keluarga ?? a.statusKeluarga ?? ""),
        kewarganegaraan: String(a.kewarganegaraan ?? "WNI"),
    });
    const anggotaNorm = (Array.isArray(anggotaRaw) ? anggotaRaw : []).map(mapAnggota);
    parsed.noKK = String(parsed.no_kk ?? parsed.noKK ?? parsed.noKk ?? "");
    parsed.namaKepala = String(parsed.nama_kepala_keluarga ?? parsed.namaKepala ?? "");
    parsed.alamat = String(parsed.alamat ?? parsed.alamat ?? "");
    parsed.rt = String(parsed.rt ?? "");
    parsed.rw = String(parsed.rw ?? "");
    parsed.desa = String(parsed.kel_desa ?? parsed.desa ?? parsed.kelurahan ?? "");
    parsed.kecamatan = String(parsed.kecamatan ?? "");
    parsed.kabupaten = String(parsed.kabupaten_kota ?? parsed.kabupaten ?? "");
    parsed.provinsi = String(parsed.provinsi ?? "");
    parsed.namaAyah = String(parsed.nama_ayah ?? parsed.namaAyah ?? "");
    parsed.namaIbu = String(parsed.nama_ibu ?? parsed.namaIbu ?? "");
    parsed.anggota = anggotaNorm;
    // ===== End normalisasi =====

    if (!parsed.noKK && (!parsed.anggota || (parsed.anggota as unknown[]).length === 0)) {
      console.error("GEMINI data kosong. Raw:", text.substring(0, 500));
      return { ok: false, error: "AI membaca tetapi data kosong. Coba foto lebih jelas/tegak lurus." };
    }
    return { ok: true, data: parsed };
  } catch (error) {
    console.error("ERROR ASLI (scanKK):", error);
    return { ok: false, error: "Terjadi kesalahan pada server." };
  }
}
