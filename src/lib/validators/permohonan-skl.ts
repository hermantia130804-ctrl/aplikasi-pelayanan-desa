import { VALIDATION_MESSAGE } from "@/constants/validation-message";
import { z } from "zod";
import { findManySchema, jenisKelaminEnum, agamaEnum, statusPermohonanEnum } from "./base";

export const searchFieldSKLEnum = z.enum(["nomor", "nama", "namaAyah", "namaIbu", "alamat"]);
export const orderFieldSKLEnum = z.enum(["nomor", "nama", "namaAyah", "namaIbu", "alamat", "createdAt", "updatedAt"]);

export const createPermohonanSKLSchema = z.object({
    nomorPermohonan: z.string().optional(),
    statusPermohonan: statusPermohonanEnum.optional(),
    nama: z.string().min(3, VALIDATION_MESSAGE.INVALID_NAME),
    tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
    tanggalLahir: z.coerce.date(),
    jenisKelamin: jenisKelaminEnum,
    alamat: z.string().min(10, VALIDATION_MESSAGE.INVALID_ADDRESS),
    
    // Data Ayah
    namaAyah: z.string().min(3, "Nama ayah harus terdiri dari minimal 3 karakter"),
    nikAyah: z.string().length(16, "NIK ayah harus terdiri dari 16 karakter"),
    pekerjaanAyah: z.string().min(1, "Pekerjaan ayah wajib diisi"),
    tempatLahirAyah: z.string().min(1, "Tempat lahir ayah wajib diisi"),
    tanggalLahirAyah: z.coerce.date(),
    agamaAyah: agamaEnum,
    
    // Data Ibu
    namaIbu: z.string().min(3, "Nama ibu harus terdiri dari minimal 3 karakter"),
    nikIbu: z.string().length(16, "NIK ibu harus terdiri dari 16 karakter"),
    pekerjaanIbu: z.string().min(1, "Pekerjaan ibu wajib diisi"),
    tempatLahirIbu: z.string().min(1, "Tempat lahir ibu wajib diisi"),
    tanggalLahirIbu: z.coerce.date(),
    agamaIbu: agamaEnum,
    
    // Dokumen
    dokumenKK: z.string().url(VALIDATION_MESSAGE.INVALID_KK_DOCUMENT).optional(),
    dokumenPengantar: z.string().url(VALIDATION_MESSAGE.INVALID_PENGANTAR_DOCUMENT).optional(),
    dokumenSuratLahir: z.string().url("Format URL dokumen surat lahir tidak valid").optional(),
    
    catatan: z.string().optional(),
});

export const updatePermohonanSKLSchema = createPermohonanSKLSchema.partial();

export const findManyPermohonanSKLSchema = findManySchema.extend({
    status: statusPermohonanEnum.optional(),
    searchBy: searchFieldSKLEnum.optional().default("nama"),
    orderField: orderFieldSKLEnum.optional().default("createdAt"),
});

export const updatePermohonanSKLStatusSchema = z.object({
    nomorPermohonan: z.string().min(1, 'Nomor permohonan wajib diisi'),
    statusPermohonan: statusPermohonanEnum,
    catatan: z.string().optional(),
});

export type TCreatePermohonanSKLSchema = z.infer<typeof createPermohonanSKLSchema>;
export type TUpdatePermohonanSKLSchema = z.infer<typeof updatePermohonanSKLSchema>;
export type TFindManyPermohonanSKLSchema = z.infer<typeof findManyPermohonanSKLSchema>;
export type TUpdatePermohonanSKLStatusSchema = z.infer<typeof updatePermohonanSKLStatusSchema>;
