import { z } from "zod";

export const createBeritaSchema = z.object({
  judul: z.string().min(5, "Judul minimal 5 karakter").max(200),
  isi: z.string().min(20, "Isi berita minimal 20 karakter"),
  kategoriMedia: z.enum(["GAMBAR", "YOUTUBE"]),
  gambarUrl: z.string().optional(),
  youtubeId: z.string().optional(),
  tanggalKegiatan: z.coerce.date(),
}).refine(
  (d) => d.kategoriMedia === "GAMBAR" ? !!d.gambarUrl : !!d.youtubeId,
  { message: "Gambar atau link YouTube wajib sesuai pilihan media", path: ["kategoriMedia"] }
);

export type TCreateBeritaSchema = z.infer<typeof createBeritaSchema>;

export const updateBeritaSchema = createBeritaSchema.partial();
export type TUpdateBeritaSchema = z.infer<typeof updateBeritaSchema>;
