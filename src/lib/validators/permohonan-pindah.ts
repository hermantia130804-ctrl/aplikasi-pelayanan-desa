import { VALIDATION_MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema, statusPermohonanEnum } from "./base";

export const jenisPermohonanPindahEnum = z.enum(["SKP", "SKPLN", "SKTT"]);

export const searchFieldPindahEnum = z.enum(["nomorPermohonan", "nama", "nik", "alamatAsal", "alamatTujuan"]);
export const orderFieldPindahEnum = z.enum(["nomorPermohonan", "nama", "nik", "jenisPermohonanPindah", "createdAt", "updatedAt"]);

// Schema untuk anggota keluarga yang pindah
export const permohonanPindahAnggotaSchema = z.object({
  nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
  nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
  shdk: z.string().min(1, "Status hubungan dalam keluarga wajib diisi"),
});

export const createPermohonanPindahSchema = z.object({
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum.optional(),
  jenisPermohonanPindah: jenisPermohonanPindahEnum.default("SKP"),
  
  // DATA PEMOHON
  nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
  nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
  
  // DATA ASAL
  alamatAsal: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
  rtAsal: z.string().min(1, "RT asal wajib diisi"),
  rwAsal: z.string().min(1, "RW asal wajib diisi"),
  desaAsal: z.string().min(1, "Desa asal wajib diisi"),
  kecamatanAsal: z.string().min(1, "Kecamatan asal wajib diisi"),
  kabupatenAsal: z.string().min(1, "Kabupaten asal wajib diisi"),
  provinsiAsal: z.string().min(1, "Provinsi asal wajib diisi"),
  
  // DATA KEPINDAHAN
  klarifikasiKepindahan: z.string().min(1, "Klarifikasi kepindahan wajib diisi"),
  jenisKepindahan: z.string().min(1, "Jenis kepindahan wajib diisi"),
  alasanPindah: z.string().min(1, "Alasan pindah wajib diisi"),
  anggotaKeluargaYangPindah: z.string().min(1, "Anggota keluarga yang pindah wajib diisi"),
  
  // DATA TUJUAN (untuk SKP)
  alamatTujuan: z.string().min(10, "Alamat tujuan wajib diisi"),
  rtTujuan: z.string().min(1, "RT tujuan wajib diisi"),
  rwTujuan: z.string().min(1, "RW tujuan wajib diisi"),
  desaTujuan: z.string().min(1, "Desa tujuan wajib diisi"),
  kecamatanTujuan: z.string().min(1, "Kecamatan tujuan wajib diisi"),
  kabupatenTujuan: z.string().min(1, "Kabupaten tujuan wajib diisi"),
  provinsiTujuan: z.string().min(1, "Provinsi tujuan wajib diisi"),
  
  // DATA SPONSOR (untuk SKTT)
  namaSponsor: z.string().optional(),
  tipeSponsor: z.string().optional(),
  noKitas: z.string().optional(),
  tanggalKitas: z.coerce.date().optional(),
  alamatSponsor: z.string().optional(),
  
  // DATA NEGARA (untuk SKTT)
  negaraTujuan: z.string().optional(),
  alamatNegaraTujuan: z.string().optional(),
  penanggungJawab: z.string().optional(),
  tanggalRencanaPindah: z.coerce.date().optional(),
  
  catatan: z.string().optional(),
  
  // DOKUMEN
  dokumenKK: z.string().url(VALIDATION_MESSAGE.INVALID_KK_DOCUMENT).optional(),
  dokumenKTP: z.string().url(VALIDATION_MESSAGE.INVALID_KTP_DOCUMENT).optional(),
  dokumenSP: z.string().url("Format URL dokumen surat pengantar tidak valid").optional(),
  
  // ARRAY ANGGOTA KELUARGA
  anggotaKeluarga: z.array(permohonanPindahAnggotaSchema).min(1, "Minimal harus ada 1 anggota keluarga yang pindah"),
});

export const updatePermohonanPindahSchema = createPermohonanPindahSchema.partial().extend({
  anggotaKeluarga: z.array(permohonanPindahAnggotaSchema).optional(),
});

export const findManyPermohonanPindahSchema = findManySchema.extend({
  status: statusPermohonanEnum.optional(),
  jenisPermohonanPindah: jenisPermohonanPindahEnum.optional(),
  searchBy: searchFieldPindahEnum.optional().default("nama"),
  orderField: orderFieldPindahEnum.optional().default("createdAt"),
});

export const followUpPermohonanPindahSchema = z.object({
  permohonanPindahId: z.string().min(1, "ID permohonan pindah wajib diisi"),
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum,
  catatan: z.string().optional(),
});

export type TCreatePermohonanPindahSchema = z.infer<typeof createPermohonanPindahSchema>;
export type TUpdatePermohonanPindahSchema = z.infer<typeof updatePermohonanPindahSchema>;
export type TFindManyPermohonanPindahSchema = z.infer<typeof findManyPermohonanPindahSchema>;
export type TFollowUpPermohonanPindahSchema = z.infer<typeof followUpPermohonanPindahSchema>;
export type TPermohonanPindahAnggotaSchema = z.infer<typeof permohonanPindahAnggotaSchema>;
