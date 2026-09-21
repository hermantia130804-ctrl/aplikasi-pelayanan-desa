import { VALIDATION_MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema, jenisKelaminEnum, agamaEnum, statusPermohonanEnum } from "./base";

export const searchFieldSKTMEnum = z.enum(["nomor", "nama", "nik", "alamat"]);
export const orderFieldSKTMEnum = z.enum(["nomor", "nama", "nik", "alamat", "createdAt", "updatedAt"]);

export const createPermohonanSKTMSchema = z.object({
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum.optional(),
  nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
  nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
  agama: agamaEnum,
  tempatLahir: z.string().min(1, VALIDATION_MESSAGE.INVALID_BIRTH_PLACE),
  tanggalLahir: z.coerce.date(),
  jenisKelamin: jenisKelaminEnum,
  alamat: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
  keterangan: z.string().min(10, "Keterangan harus minimal 10 karakter"),
  catatan: z.string().optional(),
  dokumenKK: z.string().url(VALIDATION_MESSAGE.INVALID_KK_DOCUMENT).optional(),
  dokumenKTP: z.string().url(VALIDATION_MESSAGE.INVALID_KTP_DOCUMENT).optional(),
  dokumenPengantar: z.string().url(VALIDATION_MESSAGE.INVALID_PENGANTAR_DOCUMENT).optional(),
});

export const updatePermohonanSKTMSchema = z.object({
  permohonanSKTMId: z.string().cuid(),
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum.optional(),
  nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
  nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
  agama: agamaEnum,
  tempatLahir: z.string().min(1, VALIDATION_MESSAGE.INVALID_BIRTH_PLACE),
  tanggalLahir: z.coerce.date(),
  jenisKelamin: jenisKelaminEnum,
  alamat: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
  keterangan: z.string().min(10, "Keterangan harus minimal 10 karakter"),
  catatan: z.string().optional(),
  dokumenKK: z.string().url(VALIDATION_MESSAGE.INVALID_KK_DOCUMENT).optional(),
  dokumenKTP: z.string().url(VALIDATION_MESSAGE.INVALID_KTP_DOCUMENT).optional(),
  dokumenPengantar: z.string().url(VALIDATION_MESSAGE.INVALID_PENGANTAR_DOCUMENT).optional(),
});

export const findManyPermohonanSKTMSchema = findManySchema.extend({
  search: z.string().optional(),
  searchField: searchFieldSKTMEnum.optional(),
  orderField: orderFieldSKTMEnum.optional(),
  status: statusPermohonanEnum.optional(),
});

export const updateStatusPermohonanSKTMSchema = z.object({
  nomorPermohonan: z.string().optional(),
  permohonanSKTMId: z.string().cuid(),
  statusPermohonan: statusPermohonanEnum,
  catatan: z.string().optional(),
});

export const findPermohonanSKTMSchema = z.object({
  id: z.string().cuid(),
});

// Type inference
export type TCreatePermohonanSKTMSchema = z.infer<typeof createPermohonanSKTMSchema>;
export type TUpdatePermohonanSKTMSchema = z.infer<typeof updatePermohonanSKTMSchema>;
export type TFindManyPermohonanSKTMSchema = z.infer<typeof findManyPermohonanSKTMSchema>;
export type TUpdateStatusPermohonanSKTMSchema = z.infer<typeof updateStatusPermohonanSKTMSchema>;
export type TFindPermohonanSKTMSchema = z.infer<typeof findPermohonanSKTMSchema>;
