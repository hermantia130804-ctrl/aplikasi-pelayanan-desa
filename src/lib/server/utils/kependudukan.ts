import { differenceInMonths, differenceInYears, parseISO, format } from "date-fns";

export function hitungUmur(tanggalLahir: string | Date, refDate?: Date) {
  const birth = typeof tanggalLahir === "string" ? parseISO(tanggalLahir) : tanggalLahir;
  const ref = refDate || new Date();
  const months = differenceInMonths(ref, birth);
  if (months < 12) return { umurTahun: 0, umurBulan: months, label: "0-11 BLN", isBayi: true };
  const years = differenceInYears(ref, birth);
  return { umurTahun: years, umurBulan: 0, label: String(years), isBayi: false };
}

export function isWajibKTP(tanggalLahir: string | Date, refDate?: Date, punyaKTP?: string | null): boolean {
  const birth = typeof tanggalLahir === "string" ? parseISO(tanggalLahir) : tanggalLahir;
  const ref = refDate || new Date();
  const years = differenceInYears(ref, birth);
  if (years !== 17) return false;
  if (punyaKTP === "PUNYA") return false;
  return true;
}

export function formatTanggal(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd-MM-yyyy");
}

export function isTanggalLahirInvalid(tanggalLahir: string | Date): boolean {
  const d = typeof tanggalLahir === "string" ? parseISO(tanggalLahir) : tanggalLahir;
  if (d.getFullYear() === 1970 && d.getMonth() === 0 && d.getDate() === 1) return true;
  if (d < new Date(1930, 0, 1)) return true;
  return false;
}
export function validateNIK(nik: string): boolean { return /^\d{16}$/.test(nik); }
export function validateNoKK(nkk: string): boolean { return /^\d{16}$/.test(nkk); }
export function toUpperCase(str: string): string { return str.toUpperCase().trim(); }
