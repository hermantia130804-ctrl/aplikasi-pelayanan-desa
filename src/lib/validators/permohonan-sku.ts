import { VALIDATION_MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema, jenisKelaminEnum, statusPermohonanEnum } from "./base";

export const searchFieldSKUEnum = z.enum(["nomorPermohonan", "nama", "nik", "jenisUsaha", "alamat"]);
export const orderFieldSKUEnum = z.enum(["nomorPermohonan", "nama", "nik", "jenisUsaha", "tahunBerdiriUsaha", "createdAt", "updatedAt"]);

export const createPermohonanSKUSchema = z.object({
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum.optional(),
  nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
  nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.coerce.date(),
  jenisKelamin: jenisKelaminEnum,
  alamat: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
  jenisUsaha: z.string().min(3, "Jenis usaha harus terdiri dari minimal 3 karakter"),
  tahunBerdiriUsaha: z.coerce.number().min(1900, "Tahun berdiri usaha tidak valid").max(new Date().getFullYear(), "Tahun berdiri usaha tidak boleh lebih dari tahun sekarang"),
  lokasiUsaha: z.string().min(10, "Lokasi usaha harus terdiri dari minimal 10 karakter"),
  catatan: z.string().optional(),
  dokumenKK: z.string().url(VALIDATION_MESSAGE.INVALID_KK_DOCUMENT).optional(),
  dokumenKTP: z.string().url(VALIDATION_MESSAGE.INVALID_KTP_DOCUMENT).optional(),
  dokumenSP: z.string().url("Format URL dokumen surat pengantar tidak valid").optional(),
  dokumenUsaha: z.string().url("Format URL dokumen usaha tidak valid").optional(),
  expiresAt: z.coerce.date(),
});

export const updatePermohonanSKUSchema = createPermohonanSKUSchema.partial();

export const findManyPermohonanSKUSchema = findManySchema.extend({
  status: statusPermohonanEnum.optional(),
  searchBy: searchFieldSKUEnum.optional().default("nama"),
  orderField: orderFieldSKUEnum.optional().default("createdAt"),
});

export const followUpPermohonanSKUSchema = z.object({
  permohonanSKUId: z.string().min(1, "ID permohonan SKU wajib diisi"),
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum,
  catatan: z.string().optional(),
});

export type TCreatePermohonanSKUSchema = z.infer<typeof createPermohonanSKUSchema>;
export type TUpdatePermohonanSKUSchema = z.infer<typeof updatePermohonanSKUSchema>;
export type TFindManyPermohonanSKUSchema = z.infer<typeof findManyPermohonanSKUSchema>;
export type TFollowUpPermohonanSKUSchema = z.infer<typeof followUpPermohonanSKUSchema>;
