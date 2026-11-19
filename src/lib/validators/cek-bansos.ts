import { z } from "zod";

export const cekBansosSchema = z.object({
  namaKepalaKeluarga: z.string().min(3, "Nama Kepala Keluarga minimal 3 karakter"),
  noKk: z.string().regex(/^\d{16}$/, "Nomor Kartu Keluarga harus 16 digit angka"),
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  fotoKkUrl: z.string().url("Foto KK wajib diunggah"),
});

export type TCekBansosSchema = z.infer<typeof cekBansosSchema>;

export const cekBansosTindakLanjutSchema = z
  .object({
    statusPermohonan: z.enum(["DIAJUKAN", "DITOLAK", "SELESAI"]),
    alasanDitolak: z.string().optional(),
    keteranganSelesai: z.string().optional(),
    fotoHasilUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.statusPermohonan === "DITOLAK") {
      if (!data.alasanDitolak || data.alasanDitolak.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["alasanDitolak"], message: "Alasan penolakan wajib diisi (minimal 3 karakter)" });
      }
    }
    if (data.statusPermohonan === "SELESAI") {
      if (!data.keteranganSelesai || data.keteranganSelesai.trim().length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["keteranganSelesai"], message: "Keterangan hasil wajib diisi (minimal 3 karakter)" });
      }
      if (!data.fotoHasilUrl) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fotoHasilUrl"], message: "Foto hasil pengecekan wajib diunggah" });
      }
    }
  });

export type TCekBansosTindakLanjutSchema = z.infer<typeof cekBansosTindakLanjutSchema>;
