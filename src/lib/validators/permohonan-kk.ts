import { VALIDATION_MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema, statusPermohonanEnum } from "./base";

export const alasanPermohonanKKEnum = z.enum(["BARU", "PERUBAHAN_DATA", "PENGGANTIAN", "PEMISAHAN_KK"]);
export const searchFieldKKEnum = z.enum(["nama", "nik", "alamat", "nomorPermohonan"]);
export const orderFieldKKEnum = z.enum(["nomorPermohonan", "nama", "nik", "alamat", "createdAt", "updatedAt"]);

export const createPermohonanKKSchema = z.object({
    nomorPermohonan: z.string().optional(),
    statusPermohonan: statusPermohonanEnum.optional(),
    nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
    nik: z.string().length(16, VALIDATION_MESSAGE.INVALID_NIK),
    noKKLama: z.string().optional(),
    alasanPermohonan: z.string().min(5, "Alasan permohonan minimal 5 karakter"),
    alamat: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
    rt: z.string().length(3, VALIDATION_MESSAGE.INVALID_RT),
    rw: z.string().length(3, VALIDATION_MESSAGE.INVALID_RW),
    desa: z.string().min(1, VALIDATION_MESSAGE.INVALID_VILLAGE),
    kecamatan: z.string().min(1, VALIDATION_MESSAGE.INVALID_DISTRICT),
    kabupaten: z.string().min(1, VALIDATION_MESSAGE.INVALID_REGENCY),
    provinsi: z.string().min(1, VALIDATION_MESSAGE.INVALID_PROVINCE),
    kodePos: z.string().length(5, VALIDATION_MESSAGE.INVALID_ZIP_CODE),
    dokumenAkta: z.string().url("Dokumen akta tidak valid").optional(),
    dokumenKTP: z.string().url("Dokumen KTP tidak valid").optional(),
    dokumenPengantar: z.string().url("Dokumen pengantar tidak valid").optional(),
    catatan: z.string().optional(),
});

export type TCreatePermohonanKKSchema = z.infer<typeof createPermohonanKKSchema>;
export type TUpdatePermohonanKKSchema = Partial<TCreatePermohonanKKSchema>;

export const findManyPermohonanKKSchema = findManySchema.extend({
    status: statusPermohonanEnum.optional(),
    alasan: alasanPermohonanKKEnum.optional(),
    searchBy: searchFieldKKEnum.optional().default("nama"),
    orderBy: orderFieldKKEnum.optional().default("createdAt"),
});

export type TFindManyPermohonanKKSchema = z.infer<typeof findManyPermohonanKKSchema>;

export const updateStatusPermohonanKKSchema = z.object({
    permohonanKKId: z.string().min(1),
    statusPermohonan: statusPermohonanEnum,
    catatan: z.string().optional(),
});
