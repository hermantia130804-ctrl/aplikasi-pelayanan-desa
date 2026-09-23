import { prisma } from "@/lib/prisma";

const KONFIG: Record<string, { model: keyof typeof prisma; prefix: string; field: "nomorPermohonan" }> = {
  KTP: { model: "permohonanKTP", prefix: "KTP", field: "nomorPermohonan" },
  KK: { model: "permohonanKK", prefix: "KK", field: "nomorPermohonan" },
  SKL: { model: "permohonanSKL", prefix: "SKL", field: "nomorPermohonan" },
  SKTM: { model: "permohonanSKTM", prefix: "SKTM", field: "nomorPermohonan" },
  SKK: { model: "permohonanSKK", prefix: "SKK", field: "nomorPermohonan" },
  SKU: { model: "permohonanSKU", prefix: "SKU", field: "nomorPermohonan" },
  SKD: { model: "permohonanSKD", prefix: "SKD", field: "nomorPermohonan" },
  PINDAH: { model: "permohonanPindah", prefix: "PND", field: "nomorPermohonan" },
};

/**
 * Generate nomor permohonan: PREFIX-YYYYMMDD-0001
 * Urutan reset per hari. Aman dari race condition sederhana (retry 3x).
 */
export const generateNomorPermohonan = async (jenis: keyof typeof KONFIG): Promise<string> => {
  const cfg = KONFIG[jenis];
  if (!cfg) throw new Error(`Jenis permohonan tidak dikenal: ${jenis}`);

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const tanggal = `${y}${m}${d}`;
  const prefix = `${cfg.prefix}-${tanggal}`;

  const model = prisma[cfg.model] as any;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const terakhir = await model.findFirst({
        where: { nomorPermohonan: { startsWith: prefix } },
        orderBy: { nomorPermohonan: "desc" },
      });
      const urutTerakhir = terakhir?.nomorPermohonan
        ? parseInt(terakhir.nomorPermohonan.split("-")[2] ?? "0", 10)
        : 0;
      const nomor = `${prefix}-${String(urutTerakhir + 1).padStart(4, "0")}`;
      return nomor;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Gagal membuat nomor permohonan");
};
