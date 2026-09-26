import { z } from "zod";

const baseBeritaSchema = z.object({
  judul: z.string().min(5, "Judul minimal 5 karakter").max(200),
  isi: z.string().min(20, "Isi berita minimal 20 karakter"),
  gambarUrl: z.string().optional(),
  youtubeId: z.string().optional(),
  tanggalKegiatan: z.coerce.date(),
});

export const createBeritaSchema = baseBeritaSchema.refine(
  (d) => !!d.gambarUrl || !!d.youtubeId,
  { message: "Wajib mengunggah gambar atau menambahkan link video YouTube", path: ["isi"] }
);

export type TCreateBeritaSchema = z.infer<typeof createBeritaSchema>;

export const updateBeritaSchema = baseBeritaSchema.partial();
export type TUpdateBeritaSchema = z.infer<typeof updateBeritaSchema>;
