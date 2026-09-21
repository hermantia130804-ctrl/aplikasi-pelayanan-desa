import { VALIDATION_MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema, agamaEnum, statusPermohonanEnum } from "./base";

export const searchFieldSKKEnum = z.enum(["nomorPermohonan", "nama", "nik", "alamat"]);
export const orderFieldSKKEnum = z.enum(["nomorPermohonan", "nama", "nik", "alamat", "umur", "tanggalMeninggal", "createdAt", "updatedAt"]);

export const createPermohonanSKKSchema = z.object({
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum.optional(),
  nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
  nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
  agama: agamaEnum,
  umur: z.coerce.number().min(0, "Umur harus berupa angka positif").max(150, "Umur tidak boleh lebih dari 150 tahun"),
  alamat: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
  tanggalMeninggal: z.coerce.date().optional(),
  tempatMeninggal: z.string().min(1, "Tempat meninggal wajib diisi").optional(),
  catatan: z.string().optional(),
});

export const updatePermohonanSKKSchema = createPermohonanSKKSchema.partial();

export const findManyPermohonanSKKSchema = findManySchema.extend({
  status: statusPermohonanEnum.optional(),
  searchBy: searchFieldSKKEnum.optional().default("nama"),
  orderField: orderFieldSKKEnum.optional().default("createdAt"),
});

export const followUpPermohonanSKKSchema = z.object({
  permohonanSKKId: z.string().min(1),
  nomorPermohonan:z.string().min(1),
  statusPermohonan: statusPermohonanEnum,
  catatan: z.string().optional(),
});

export type TCreatePermohonanSKKSchema = z.infer<typeof createPermohonanSKKSchema>;
export type TUpdatePermohonanSKKSchema = z.infer<typeof updatePermohonanSKKSchema>;
export type TFindManyPermohonanSKKSchema = z.infer<typeof findManyPermohonanSKKSchema>;
export type TFollUpPermohonanSKKSchema = z.infer<typeof followUpPermohonanSKKSchema>;
