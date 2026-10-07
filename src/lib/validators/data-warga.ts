import { z } from "zod";
import { JENIS_KELAMIN, AGAMA, PENDIDIKAN, PEKERJAAN, STATUS_PERKAWINAN, STATUS_KELUARGA, STATUS_KTP, BANTUAN_OPTIONS, BPJS_OPTIONS, DESIL_OPTIONS } from "@/constants/data-warga";

export const createDataWargaSchema = z.object({
  namaLengkap: z.string().min(3),
  nik: z.string().regex(/^\d{16}$/, "NIK 16 digit"),
  noKk: z.string().regex(/^\d{16}$/, "No.KK 16 digit"),
  jenisKelamin: z.enum(JENIS_KELAMIN),
  statusKeluarga: z.enum(STATUS_KELUARGA),
  tempatLahir: z.string().min(1),
  tanggalLahir: z.coerce.date(),
  agama: z.enum(AGAMA),
  pendidikan: z.enum(PENDIDIKAN),
  pekerjaan: z.enum(PEKERJAAN),
  statusPerkawinan: z.enum(STATUS_PERKAWINAN),
  kewarganegaraan: z.string().default("WNI"),
  namaAyah: z.string().min(1),
  namaIbu: z.string().min(1),
  namaPanggilan: z.string().optional(),
  noHp: z.string().optional(),
  punyaKtp: z.enum(STATUS_KTP).default("BELUM"),
  bantuan: z.array(z.enum(BANTUAN_OPTIONS)).default([]),
  bpjs: z.string().optional(),
  desil: z.string().optional(),
  alamat: z.string().min(3),
  keterangan: z.string().optional(),
});
export type TCreateDataWargaSchema = z.infer<typeof createDataWargaSchema>;
export const updateDataWargaSchema = createDataWargaSchema.partial();
export type TUpdateDataWargaSchema = z.infer<typeof updateDataWargaSchema>;
