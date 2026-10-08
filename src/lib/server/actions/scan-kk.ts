"use server";

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

export async function scanKKAction(imageDataUrl: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, error: "GEMINI_API_KEY belum diset di server." };

    if (!imageDataUrl?.startsWith("data:image/")) {
      return { ok: false, error: "Gambar tidak valid." };
    }

    const [meta, base64] = imageDataUrl.split(",");
    const mimeType = meta.match(/data:(image\/[\w.]+);/)?.[1] ?? "image/jpeg";

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(50000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            role: "user",
            parts: [
              { text: "Baca Kartu Keluarga ini. Kembalikan JSON saja." },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
          generationConfig: { temperature: 0.05 },
        }),
      });

    if (!res.ok) {
      const errText = await res.text();
      console.error("GEMINI ERROR:", res.status, errText.substring(0, 300));
      return { ok: false, error: `AI API error ${res.status}: ${errText.substring(0, 150)}` };
    }

    const result = await res.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { ok: false, error: "AI tidak mengembalikan respons." };

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\w*\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    try {
      const parsed = JSON.parse(cleaned);
      if (!parsed.noKK && (!parsed.anggota || parsed.anggota.length === 0)) {
        return { ok: false, error: "AI membaca tetapi data kosong. Coba foto lebih jelas." };
      }
      return { ok: true, data: parsed };
    } catch (e) {
      return { ok: false, error: "AI response tidak valid: " + (e instanceof Error ? e.message : "parse error") };
    }
  } catch (error) {
    console.error("ERROR ASLI (scanKK):", error);
    return { ok: false, error: "Terjadi kesalahan pada server." };
  }
}
