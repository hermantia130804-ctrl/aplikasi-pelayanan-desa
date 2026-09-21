import { z } from "zod";

export const statusPermohonanEnum = z.enum(["DIAJUKAN", "DISETUJUI", "DITOLAK"]);
export const jenisKelaminEnum = z.enum(["LAKI_LAKI", "PEREMPUAN"]);
export const golonganDarahEnum = z.enum(["A", "B", "AB", "O"]);
export const statusPerkawinanEnum = z.enum(["BELUM_KAWIN", "KAWIN", "CERAI_HIDUP", "CERAI_MATI"]);
export const agamaEnum = z.enum(["ISLAM", "PROTESTAN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"]);

// Describe your search params, and reuse this in useQueryStates / createSerializer:
export const findManySchema = z.object({
  limit: z.coerce.number().optional().default(10),
  page: z.coerce.number().optional().default(1),
  searchValue: z.string().optional().default(""),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export const paginationSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
});

export const dateRangeSchema = z.object({
  gte: z.date().optional(),
  lte: z.date().optional(),
  gt: z.date().optional(),
  lt: z.date().optional(),
});

export type TPaginationSchema = z.infer<typeof paginationSchema>;
export type TDateRangeSchema = z.infer<typeof dateRangeSchema>;
