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

const MODELS_FALLBACK = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-lite-latest"];

export async function scanKKAction(imageDataUrl: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, error: "GEMINI_API_KEY belum diset di server." };
    if (!imageDataUrl?.startsWith("data:image/")) {
      return { ok: false, error: "Gambar tidak valid." };
    }

    const [meta, base64] = imageDataUrl.split(",");
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
              generationConfig: { temperature: 0.05 },
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
