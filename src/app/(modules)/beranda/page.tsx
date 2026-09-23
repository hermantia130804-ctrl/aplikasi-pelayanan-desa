import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beranda Masyarakat | Desa Sukamaju",
  description: "Informasi dan pengumuman untuk masyarakat Desa Sukamaju",
};

const pengumuman = [
  {
    tanggal: "23 September 2026",
    judul: "Layanan Administrasi Online Kini Tersedia",
    isi: "Warga Desa Sukamaju kini dapat mengajukan surat administrasi (KTP, SKTM, SKL, SKK, SKU, SKD) secara online melalui aplikasi ini. Verifikasi email dilakukan otomatis. Status permohonan dapat dipantau di menu Permohonan Saya.",
  },
  {
    tanggal: "22 September 2026",
    judul: "Persyaratan Umum Pengajuan Surat",
    isi: "Untuk pengajuan surat, mohon siapkan scan dokumen dalam format PDF: Kartu Keluarga dan Surat Pengantar dari RT/RW. Ukuran file maksimal 9 MB per dokumen.",
  },
  {
    tanggal: "20 September 2026",
    judul: "Jam Layanan Kantor Desa",
    isi: "Kantor desa melayani setiap hari kerja (Senin - Jumat) pukul 08.00 - 14.00 WIB. Untuk layanan online, permohonan dapat diajukan 24 jam.",
  },
];

const informasi = [
  { emoji: "🪪", judul: "KTP", isi: "Pengajuan KTP baru, perubahan data, dan penggantian KTP rusak/hilang." },
  { emoji: "👶", judul: "SKL", isi: "Surat Keterangan Kelahiran untuk anak warga desa." },
  { emoji: "🤝", judul: "SKTM", isi: "Surat Keterangan Tidak Mampu untuk keperluan beasiswa, bantuan, dll." },
  { emoji: "🕯️", judul: "SKK", isi: "Surat Keterangan Kematian untuk keperluan administrasi." },
  { emoji: "🏪", judul: "SKU", isi: "Surat Keterangan Usaha untuk perizinan usaha warga." },
  { emoji: "📍", judul: "SKD", isi: "Surat Keterangan Domisili bagi warga yang tinggal di desa." },
];

export default function BerandaMasyarakatPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 py-4 md:py-6 px-4 lg:px-6">

          <section className="relative overflow-hidden rounded-xl border">
            <img src="/login-desk.jpg" alt="Desa Sukamaju" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 px-6 py-12 md:px-10 md:py-16">
              <h1 className="text-2xl font-bold text-white md:text-4xl">
                Informasi &amp; Pengumuman
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
                Kabar terbaru dan informasi penting untuk masyarakat Desa Sukamaju,
                Kecamatan Cibungbulang, Kabupaten Bogor.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">📢 Pengumuman Terbaru</h2>
            <div className="flex flex-col gap-4">
              {pengumuman.map((p) => (
                <div key={p.judul} className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                  <p className="text-xs font-medium text-muted-foreground">{p.tanggal}</p>
                  <h3 className="mt-1 text-lg font-semibold">{p.judul}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.isi}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">🗂️ Jenis Layanan Desa</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {informasi.map((i) => (
                <div key={i.judul} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="text-2xl">{i.emoji}</div>
                  <h3 className="mt-2 font-semibold">{i.judul}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{i.isi}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
