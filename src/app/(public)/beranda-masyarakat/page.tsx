import { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beranda Masyarakat | Desa Sukamaju",
  description: "Informasi dan berita kegiatan untuk masyarakat Desa Sukamaju",
};

const layanan = [
  { emoji: "🪪", nama: "KTP", deskripsi: "Pengajuan KTP baru, perubahan data, dan penggantian." },
  { emoji: "👶", nama: "SKL", deskripsi: "Surat Keterangan Kelahiran anak warga desa." },
  { emoji: "🤝", nama: "SKTM", deskripsi: "Surat Keterangan Tidak Mampu untuk berbagai keperluan." },
  { emoji: "🕯️", nama: "SKK", deskripsi: "Surat Keterangan Kematian warga desa." },
  { emoji: "🏪", nama: "SKU", deskripsi: "Surat Keterangan Usaha untuk perizinan." },
  { emoji: "📍", nama: "SKD", deskripsi: "Surat Keterangan Domisili warga desa." },
];

const extractYoutubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (match) return match[1];
  return url.length === 11 ? url : null;
};

const formatTanggal = (d: Date | string) =>
  new Date(d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function BerandaMasyarakatPage() {
  const beritaList = await prisma.beritaKegiatan.findMany({
    orderBy: { tanggalKegiatan: "desc" },
    include: { penulis: true },
  });

  return (
    <div>
      {/* HERO — GAMBAR KANTOR DESA */}
      <section className="relative">
        <Image
          src="/login-desk.jpg"
          alt="Kantor Desa Sukamaju"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center text-white sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
            Kecamatan Cibungbulang · Kabupaten Bogor · Jawa Barat
          </span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Informasi &amp; Berita Desa Sukamaju
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm opacity-85 sm:text-base">
            Kabar terbaru, kegiatan, dan pengumuman penting untuk masyarakat
            Desa Sukamaju.
          </p>
        </div>
      </section>

      {/* BERITA KEGIATAN DARI DATABASE */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
              Berita Kegiatan
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Kegiatan Terbaru di Desa Sukamaju
            </h2>
          </div>

          {beritaList.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
              Belum ada berita kegiatan yang dipublikasikan.
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {beritaList.map((b) => {
                const ytId = b.youtubeId ? extractYoutubeId(b.youtubeId) : null;
                return (
                  <article
                    key={b.beritaId}
                    className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {ytId ? (
                      <div className="aspect-video w-full">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={b.judul}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    ) : b.gambarUrl ? (
                      <img
                        src={b.gambarUrl}
                        alt={b.judul}
                        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        📅 {formatTanggal(b.tanggalKegiatan)}
                      </p>
                      <h3 className="mt-2 text-xl font-bold leading-snug">{b.judul}</h3>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {b.isi}
                      </p>
                      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                        ✍️ Dipublikasikan oleh: {b.penulis.name}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* LAYANAN */}
      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
              Layanan Administrasi
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Jenis Layanan Desa
            </h2>
            <p className="mt-4 text-muted-foreground">
              Untuk mengajukan permohonan, silakan masuk terlebih dahulu melalui
              tombol Masuk / Daftar di atas.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layanan.map((l) => (
              <div key={l.nama} className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="text-3xl">{l.emoji}</div>
                <h3 className="mt-3 font-bold">{l.nama}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{l.deskripsi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}