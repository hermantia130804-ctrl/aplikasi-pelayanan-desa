import { VALIDATION_MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema, jenisKelaminEnum, golonganDarahEnum, statusPerkawinanEnum, agamaEnum, statusPermohonanEnum } from "./base";

export const jenisPermohonanKTP = z.enum(["BARU", "PERUBAHAN", "PENGGANTIAN"]);
export const searchFieldKTPEnum = z.enum(["nomor", "nama", "nik", "alamat"]);
export const orderFieldKTPEnum = z.enum(["nomor", "nama", "nik", "alamat", "createdAt", "updatedAt"]);

export const createPermohonanKTPSchema = z.object({
    nomorPermohonan: z.string().optional(),
    jenisPermohonanKTP: jenisPermohonanKTP.optional(),
    statusPermohonan: statusPermohonanEnum.optional(),
    nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
    nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
    jenisKelamin: jenisKelaminEnum,
    golonganDarah: golonganDarahEnum,
    statusPerkawinan: statusPerkawinanEnum,
    agama: agamaEnum,
    tempatLahir: z.string().min(1),
    tanggalLahir: z.coerce.date(),
    alamat: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
    provinsi: z.string().min(1, VALIDATION_MESSAGE.INVALID_PROVINCE),
    kabupaten: z.string().min(1, VALIDATION_MESSAGE.INVALID_REGENCY),
    kecamatan: z.string().min(1, VALIDATION_MESSAGE.INVALID_DISTRICT),
    desa: z.string().min(1, VALIDATION_MESSAGE.INVALID_VILLAGE),
    rt: z.string().length(3, VALIDATION_MESSAGE.INVALID_RT),
    rw: z.string().length(3, VALIDATION_MESSAGE.INVALID_RW),
    kodePos: z.string().length(5, VALIDATION_MESSAGE.INVALID_ZIP_CODE),
    dokumenKK: z.string().url(VALIDATION_MESSAGE.INVALID_KK_DOCUMENT).optional(),
    dokumenPengantar: z.string().url(VALIDATION_MESSAGE.INVALID_PENGANTAR_DOCUMENT).optional(),
    catatan: z.string().optional(),
});

export const updatePermohonanKTPSchema = createPermohonanKTPSchema.partial()

export const findManyPermohonanKTPSchema = findManySchema.extend({
    status: statusPermohonanEnum.optional(),
    jenis: jenisPermohonanKTP.optional(),
    searchBy: searchFieldKTPEnum.optional().default("nama"),
    orderBy: orderFieldKTPEnum.optional().default("createdAt"),
});

export const followUpPermohonanKTPSchema =  z.object({
  permohonanKtpId: z.string().min(1),
  nomorPermohonan: z.string().min(1),
  statusPermohonan: statusPermohonanEnum,
  catatan: z.string().optional(),
});


export type TFollowUpPermohonanKTPSchema = z.infer<typeof followUpPermohonanKTPSchema>;
export type TStatusPermohonanEnum = z.infer<typeof statusPermohonanEnum>;
export type TCreatePermohonanKTPSchema = z.infer<typeof createPermohonanKTPSchema>;
export type TUpdatePermohonanKTPSchema = z.infer<typeof updatePermohonanKTPSchema>;
export type TFindManyPermohonanKTPSchema = z.infer<typeof findManyPermohonanKTPSchema>;
