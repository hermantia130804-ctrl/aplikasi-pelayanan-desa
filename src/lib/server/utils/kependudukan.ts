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
