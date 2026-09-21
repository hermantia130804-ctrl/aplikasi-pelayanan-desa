import { StatusPermohonan, Agama, JenisKelamin, WargaNegara } from "@/generated/prisma";
import { z } from "zod";

const statusPermohonanEnum = z.nativeEnum(StatusPermohonan);
const agamaEnum = z.nativeEnum(Agama);
const jenisKelaminEnum = z.nativeEnum(JenisKelamin);
const warganNegaraEnum = z.nativeEnum(WargaNegara);

export const createPermohonanSKDSchema = z.object({
  nik: z.string().min(16, "NIK harus 16 digit").max(16, "NIK harus 16 digit"),
  nama: z.string().min(1, "Nama wajib diisi"),
  alamatKTP: z.string().min(1, "Alamat KTP wajib diisi"),
  alamatDomisili: z.string().min(1, "Alamat domisili wajib diisi"),
  agama: agamaEnum,
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.date({ required_error: "Tanggal lahir wajib diisi" }),
  jenisKelamin: jenisKelaminEnum,
  wargaNegara: warganNegaraEnum,
  catatan: z.string().optional(),
  dokumenKK: z.string().optional(),
  dokumenKTP: z.string().optional(),
  dokumenSP: z.string().optional(),
  expiresAt: z.date({ required_error: "Tanggal kedaluwarsa wajib diisi" }),
});

export const updatePermohonanSKDSchema = createPermohonanSKDSchema.partial();

export const findManyPermohonanSKDSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  searchValue: z.string().optional(),
  searchBy: z.enum(["nama", "nik", "alamatKTP", "alamatDomisili", "nomorPermohonan"]).default("nama"),
  status: statusPermohonanEnum.optional(),
  orderField: z.enum(["createdAt", "updatedAt", "nama", "nik"]).default("createdAt"),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const followUpPermohonanSKDSchema = z.object({
  permohonanSKDId: z.string().min(1, "ID permohonan SKD wajib diisi"),
  nomorPermohonan: z.string().optional(),
  statusPermohonan: statusPermohonanEnum,
  catatan: z.string().optional(),
});

export type CreatePermohonanSKDInput = z.infer<typeof createPermohonanSKDSchema>;
export type UpdatePermohonanSKDInput = z.infer<typeof updatePermohonanSKDSchema>;
export type FindManyPermohonanSKDInput = z.infer<typeof findManyPermohonanSKDSchema>;
export type FollowUpPermohonanSKDInput = z.infer<typeof followUpPermohonanSKDSchema>;
