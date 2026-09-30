/**
 * Jabatan petugas & pemetaan tugas (sumber kebijakan notifikasi).
 * Aturan: hanya petugas dengan jabatan yang bertugas pada suatu jenis
 * yang menerima notifikasi. ADMIN tidak menerima notifikasi.
 * String jenis HARUS cocok dengan yang dipakai di pemanggilan notifikasiPetugasBaru.
 */
export const JABATAN_PETUGAS = [
  "Kasi Pemerintahan",
  "Kasi Kesejahteraan",
  "Kasi Pelayanan",
  "Global",
] as const;

export type TJabatanPetugas = (typeof JABATAN_PETUGAS)[number];

export const TUGAS_JABATAN: Record<string, string[]> = {
  "Kasi Pemerintahan": ["KTP", "KK", "SKL", "SKTM", "SKK", "SKU", "SKD"],
  "Kasi Kesejahteraan": ["Perbaikan Desil"],
  "Kasi Pelayanan": [],
  "Global": [],
};
