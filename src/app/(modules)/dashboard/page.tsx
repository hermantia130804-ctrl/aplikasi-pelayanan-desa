import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { WelcomeBansosCard } from "@/components/welcome-bansos-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beranda | Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor",
  description: "Portal resmi Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor",
};

/* =====================================================
   DATA PROFIL DESA — EDIT ANGKA DI SINI
   (sesuaikan dengan data monografi desa tahun 2026)
   ===================================================== */
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
    barat: "Desa Pagelaran",
  },
};

const testimoni = [
  { nama: "Bapak Asep", peran: "Warga RT 03", isi: "Sekarang mengurus surat jauh lebih cepat. Cukup daftar online, tidak perlu antre lama di kantor desa.", rating: 5 },
  { nama: "Ibu Yati", peran: "Pemilik Warung", isi: "Pembuatan surat keterangan usaha dibantu dari awal sampai selesai. Pelayanannya ramah dan jelas.", rating: 5 },
  { nama: "Sdr. Rian", peran: "Mahasiswa", isi: "Butuh SKTM untuk beasiswa, prosesnya transparan dan bisa dipantau statusnya. Sangat membantu.", rating: 4 },
];
/* ===================================================== */

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

// Helper: konversi hasil groupBy Prisma ke array { label, nilai }.
type GroupResult = { field: string | null; _count: { _all: number } };
function toBars(rows: GroupResult[]): Array<{ label: string; nilai: number }> {
  return rows
    .filter((r) => r.field && r.field.trim() !== "")
    .map((r) => ({ label: r.field as string, nilai: r._count._all }))
    .sort((a, b) => b.nilai - a.nilai);
}

export default async function BerandaPage() {
  // Fetch session untuk welcome card (USER & RT only)
  const session = await findCurrentSessionService();
  const showWelcome = session?.user && (session.user.role === "USER" || session.user.role === "RT");

  // Statistik dari DB real (tabel DataWarga):
  // - totalPenduduk: count semua baris yang diinput RT di Kelola Data Warga
  // - totalKK: count baris dengan statusKeluarga = "KEPALA KELUARGA"
  // - distribusi jenisKelamin / pekerjaan / pendidikan / agama via groupBy
  const [
    totalPengguna,
    ktp, sktm, skl, skk, sku, skd, pindah,
    totalPenduduk,
    totalKK,
    jenisKelaminRows,
    pekerjaanRows,
    pendidikanRows,
    agamaRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.permohonanKTP.count(),
    prisma.permohonanSKTM.count(),
    prisma.permohonanSKL.count(),
    prisma.permohonanSKK.count(),
    prisma.permohonanSKU.count(),
    prisma.permohonanSKD.count(),
    prisma.permohonanPindah.count(),
    prisma.dataWarga.count(),
    prisma.dataWarga.count({ where: { statusKeluarga: "KEPALA KELUARGA" } }),
    prisma.dataWarga.groupBy({ by: ["jenisKelamin"], _count: { _all: true } }),
    prisma.dataWarga.groupBy({ by: ["pekerjaan"], _count: { _all: true } }),
    prisma.dataWarga.groupBy({ by: ["pendidikan"], _count: { _all: true } }),
    prisma.dataWarga.groupBy({ by: ["agama"], _count: { _all: true } }),
  ]);
  const totalPermohonan = ktp + sktm + skl + skk + sku + skd + pindah;

  const jkBars = toBars(jenisKelaminRows as GroupResult[]);
  const pekerjaanBars = toBars(pekerjaanRows as GroupResult[]);
  const pendidikanBars = toBars(pendidikanRows as GroupResult[]);
  const agamaBars = toBars(agamaRows as GroupResult[]);
  const totalPekerjaan = pekerjaanBars.reduce((a, b) => a + b.nilai, 0);
  const totalPendidikan = pendidikanBars.reduce((a, b) => a + b.nilai, 0);

  const lakiLaki = jkBars.find((b) => b.label.toUpperCase().includes("LAKI"))?.nilai ?? 0;
  const perempuan = jkBars.find((b) => b.label.toUpperCase().includes("PEREMPUAN"))?.nilai ?? 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 py-4 md:py-6 px-4 lg:px-6">

          <section className="relative overflow-hidden rounded-xl border">
            <img src="/login-desk.jpg" alt="Desa Sukamaju" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/65" />
            <div className="relative z-10 px-6 py-12 text-center md:px-10 md:py-20">
              <p className="text-xs font-medium uppercase tracking-wide text-white/80 md:text-sm">
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

          {/* Welcome + Detail Bansos card — hanya untuk USER & RT */}
          {showWelcome && session?.user && (
            <WelcomeBansosCard
              nama={session.user.name}
              nik={session.user.nik}
              detailBansos={session.user.detailBansos}
            />
          )}

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Penduduk" value={totalPenduduk} emoji="👥" />
            <StatCard label="Jumlah Keluarga" value={totalKK} emoji="🏠" />
            <StatCard label="Warga Terdaftar Online" value={totalPengguna} emoji="💻" />
            <StatCard label="Total Permohonan" value={totalPermohonan} emoji="📄" />
          </section>

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
                  <p>🏘️ RW: {profilDesa.jumlahRW} • RT: {profilDesa.jumlahRT}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">👥 Statistik Penduduk &amp; SDM</h2>
              <p className="text-sm text-muted-foreground">Data penduduk real-time dari input seluruh RT di Kelola Data Warga.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                <h3 className="font-semibold">Jenis Kelamin</h3>
                {lakiLaki === 0 && perempuan === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Belum ada data penduduk.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    <Bar label="Laki-laki" nilai={lakiLaki} total={totalPenduduk} />
                    <Bar label="Perempuan" nilai={perempuan} total={totalPenduduk} />
                  </div>
                )}
                <h3 className="mt-6 font-semibold">Pendidikan</h3>
                {pendidikanBars.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Belum ada data pendidikan.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {pendidikanBars.map((p) => (
                      <Bar key={p.label} label={p.label} nilai={p.nilai} total={totalPendidikan} />
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                <h3 className="font-semibold">Mata Pencaharian</h3>
                {pekerjaanBars.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Belum ada data pekerjaan.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {pekerjaanBars.map((p) => (
                      <Bar key={p.label} label={p.label} nilai={p.nilai} total={totalPekerjaan} />
                    ))}
                  </div>
                )}
                <h3 className="mt-6 font-semibold">Agama</h3>
                {agamaBars.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Belum ada data agama.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {agamaBars.map((p) => (
                      <Bar key={p.label} label={p.label} nilai={p.nilai} total={totalPenduduk} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">⭐ Testimoni Warga</h2>
              <p className="text-sm text-muted-foreground">Apa kata warga tentang layanan {profilDesa.namaDesa}.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {testimoni.map((t) => (
                <div key={t.nama} className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
                  <div className="text-yellow-500">{"⭐".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</div>
                  <p className="mt-3 text-sm italic">&quot;{t.isi}&quot;</p>
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
