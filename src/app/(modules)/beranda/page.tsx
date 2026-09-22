import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beranda | Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor",
  description: "Portal resmi Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor",
};

/* ============================================
   DATA PROFIL DESA — EDIT ANGKA DI SINI
   (ganti sesuai data monografi desa 2026)
   ============================================ */
const profilDesa = {
  namaDesa: "Desa Sukamaju",
  kecamatan: "Kecamatan Cibungbulang",
  kabupaten: "Kabupaten Bogor",
  provinsi: "Jawa Barat",
  luasWilayah: "425 Ha",
  jumlahRW: 8,
  jumlahRT: 24,
  batasWilayah: {
    utara: "Desa Cimanggu",
    timur: "Desa Cibuluh",
    selatan: "Desa Cibeber",
    barat: "Desa Cimanggu",
  },
};

const statistikPenduduk = {
  totalPenduduk: 12450,
  jumlahKeluarga: 3820,
  lakiLaki: 6320,
  perempuan: 6130,
  pekerjaan: [
    { label: "Petani", nilai: 2100, emoji: "🌾" },
    { label: "Karyawan Swasta", nilai: 3400, emoji: "🏢" },
    { label: "Wirausaha", nilai: 1500, emoji: "💼" },
    { label: "PNS/TNI/Polri", nilai: 320, emoji: "🏛️" },
    { label: "Buruh Harian", nilai: 1800, emoji: "👷" },
    { label: "Lainnya", nilai: 3330, emoji: "🔧" },
  ],
  pendidikan: [
    { label: "SD/Sederajat", nilai: 4100 },
    { label: "SMP/Sederajat", nilai: 3500 },
    { label: "SMA/Sederajat", nilai: 3200 },
    { label: "Diploma/Sarjana", nilai: 1450 },
    { label: "Tidak/Belum Sekolah", nilai: 200 },
  ],
  agama: [
    { label: "Islam", nilai: 12100, emoji: "🕌" },
    { label: "Kristen", nilai: 180, emoji: "⛪" },
    { label: "Katolik", nilai: 90, emoji: "⛪" },
    { label: "Hindu/Buddha/Lainnya", nilai: 80, emoji: "🛕" },
  ],
};

const sdmUnggulan = [
  { nama: "Kepala Desa", namaOrang: "Bpk. [Nama Kepala Desa]", deskripsi: "Memimpin pemerintahan desa dan pembangunan.", emoji: "👔" },
  { nama: "Sekretaris Desa", namaOrang: "Bpk. [Nama Sekretaris]", deskripsi: "Mengkoordinasikan administrasi pemerintahan.", emoji: "📋" },
  { nama: "Kaur Pelayanan", namaOrang: "Ibu [Nama Kaur]", deskripsi: "Melayani kebutuhan administrasi warga.", emoji: "🗂️" },
];

const testimoni = [
  {
    nama: "Bapak Asep",
    peran: "Warga RT 03",
    isi: "Sekarang mengurus surat jauh lebih cepat. Cukup daftar online, tidak perlu antre lama di kantor desa.",
    rating: 5,
  },
  {
    nama: "Ibu Yati",
    peran: "Pemilik Warung",
    isi: "Pembuatan surat keterangan usaha dibantu dari awal sampai selesai. Pelayanannya ramah dan jelas.",
    rating: 5,
  },
  {
    nama: "Sdr. Rian",
    peran: "Mahasiswa",
    isi: "Butuh SKTM untuk beasiswa, prosesnya transparan dan bisa dipantau statusnya. Sangat membantu.",
    rating: 4,
  },
];

/* ============================================ */

function Bar({ label, nilai, total }: { label: string; nilai: number; total: number }) {
  const persen = total > 0 ? Math.round((nilai / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{nilai.toLocaleString("id-ID")} ({persen}%)</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${persen}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
      <div className="text-2xl">{emoji}</div>
      <p className="mt-2 text-2xl font-bold md:text-3xl">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function BerandaPage() {
  const [totalPengguna, ktp, sktm, skl, skk, sku, skd, pindah] = await Promise.all([
    prisma.user.count(),
    prisma.permohonanKTP.count(),
    prisma.permohonanSKTM.count(),
    prisma.permohonanSKL.count(),
    prisma.permohonanSKK.count(),
    prisma.permohonanSKU.count(),
    prisma.permohonanSKD.count(),
    prisma.permohonanPindah.count(),
  ]);
  const totalPermohonan = ktp + sktm + skl + skk + sku + skd + pindah;

  const totalPekerjaan = statistikPenduduk.pekerjaan.reduce((a, b) => a + b.nilai, 0);
  const totalPendidikan = statistikPenduduk.pendidikan.reduce((a, b) => a + b.nilai, 0);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 py-4 md:py-6 px-4 lg:px-6">

          {/* HERO */}
          <section className="relative overflow-hidden rounded-xl border">
            <img src="/login-desk.jpg" alt="Desa Sukamaju" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/65" />
            <div className="relative z-10 px-6 py-12 text-center md:px-10 md:py-20">
              <p className="text-sm font-medium tracking-wide text-white/80 uppercase">
                {profilDesa.kecamatan} • {profilDesa.kabupaten} • {profilDesa.provinsi}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">
                Selamat Datang di {profilDesa.namaDesa}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-white/85 md:text-base">
                Portal resmi pelayanan administrasi dan informasi {profilDesa.namaDesa}.
                Melayani warga dengan cepat, transparan, dan akuntabel.
              </p>
            </div>
          </section>

          {/* STATISTIK CEPAT */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Penduduk (2026)" value={statistikPenduduk.totalPenduduk} emoji="👥" />
            <StatCard label="Jumlah Keluarga" value={statistikPenduduk.jumlahKeluarga} emoji="🏠" />
            <StatCard label="Warga Terdaftar Online" value={totalPengguna} emoji="💻" />
            <StatCard label="Total Permohonan" value={totalPermohonan} emoji="📄" />
          </section>

          {/* PETA WILAYAH */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">🗺️ Peta Wilayah Desa Sukamaju</h2>
              <p className="text-sm text-muted-foreground">Wilayah desa beserta batas-batasnya.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="overflow-hidden rounded-xl border shadow-sm lg:col-span-2">
                <iframe
                  src="https://www.google.com/maps?q=Sukamaju,Cibungbulang,Bogor&hl=id&z=14&output=embed"
                  className="h-80 w-full md:h-96"
                  loading="lazy"
                  title="Peta Desa Sukamaju"
                />
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                <h3 className="font-semibold">Batas Wilayah</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>🔼 Utara: {profilDesa.batasWilayah.utara}</li>
                  <li>▶️ Timur: {profilDesa.batasWilayah.timur}</li>
                  <li>🔽 Selatan: {profilDesa.batasWilayah.selatan}</li>
                  <li>◀️ Barat: {profilDesa.batasWilayah.barat}</li>
                </ul>
                <div className="mt-4 space-y-1 border-t pt-4 text-sm text-muted-foreground">
                  <p>📐 Luas Wilayah: {profilDesa.luasWilayah}</p>
                  <p>🏘️ Jumlah RW: {profilDesa.jumlahRW} • RT: {profilDesa.jumlahRT}</p>
                </div>
              </div>
            </div>
          </section>

          {/* SDM PENDUDUK */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">👥 Statistik Penduduk &amp; SDM</h2>
              <p className="text-sm text-muted-foreground">Data penduduk ter-update tahun 2026.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                <h3 className="font-semibold">Komposisi Jenis Kelamin</h3>
                <div className="mt-4 space-y-4">
                  <Bar label="Laki-laki" nilai={statistikPenduduk.lakiLaki} total={statistikPenduduk.totalPenduduk} />
                  <Bar label="Perempuan" nilai={statistikPenduduk.perempuan} total={statistikPenduduk.totalPenduduk} />
                </div>
                <h3 className="mt-6 font-semibold">Pendidikan</h3>
                <div className="mt-4 space-y-4">
                  {statistikPenduduk.pendidikan.map((p) => (
                    <Bar key={p.label} label={p.label} nilai={p.nilai} total={totalPendidikan} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                <h3 className="font-semibold">Mata Pencaharian</h3>
                <div className="mt-4 space-y-4">
                  {statistikPenduduk.pekerjaan.map((p) => (
                    <Bar key={p.label} label={`${p.emoji} ${p.label}`} nilai={p.nilai} total={totalPekerjaan} />
                  ))}
                </div>
                <h3 className="mt-6 font-semibold">Agama</h3>
                <div className="mt-4 space-y-4">
                  {statistikPenduduk.agama.map((p) => (
                    <Bar key={p.label} label={`${p.emoji} ${p.label}`} nilai={p.nilai} total={statistikPenduduk.totalPenduduk} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SDM UNGGULAN / PERANGKAT DESA */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">👔 Perangkat Desa</h2>
              <p className="text-sm text-muted-foreground">Struktur perangkat yang melayani warga.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {sdmUnggulan.map((s) => (
                <div key={s.nama} className="rounded-xl border bg-card p-4 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">{s.emoji}</div>
                  <h3 className="mt-3 font-semibold">{s.nama}</h3>
                  <p className="text-sm text-primary">{s.namaOrang}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          {/* TESTIMONI */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">⭐ Testimoni Warga</h2>
              <p className="text-sm text-muted-foreground">Apa kata warga tentang layanan Desa Sukamaju.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {testimoni.map((t) => (
                <div key={t.nama} className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                  <div className="text-yellow-500">{"⭐".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</div>
                  <p className="mt-3 text-sm italic">"{t.isi}"</p>
                  <p className="mt-3 font-semibold">{t.nama}</p>
                  <p className="text-xs text-muted-foreground">{t.peran}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
