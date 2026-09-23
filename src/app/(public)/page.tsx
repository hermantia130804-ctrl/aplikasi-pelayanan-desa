import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statistikResmi = [
    { label: "Jiwa Penduduk", value: "9.713" },
    { label: "Luas Wilayah", value: "±200 Ha" },
    { label: "Dusun / RW / RT", value: "3 / 9 / 26" },
];

const layanan = [
    { emoji: "🪪", nama: "KTP", deskripsi: "Pengajuan KTP baru, perubahan data, dan penggantian." },
    { emoji: "👨‍👩‍👧‍👦", nama: "KK", deskripsi: "Pengajuan dan perubahan data Kartu Keluarga." },
    { emoji: "👶", nama: "SKL", deskripsi: "Surat Keterangan Kelahiran." },
    { emoji: "🤝", nama: "SKTM", deskripsi: "Surat Keterangan Tidak Mampu." },
    { emoji: "🕯️", nama: "SKK", deskripsi: "Surat Keterangan Kematian." },
    { emoji: "🏪", nama: "SKU", deskripsi: "Surat Keterangan Usaha." },
    { emoji: "📍", nama: "SKD", deskripsi: "Surat Keterangan Domisili." },
];

const prestasi = [
    { judul: "5 Besar Lomba Desa Jabar 2023", isi: "Mewakili Kabupaten Bogor di Lomba Desa & Kelurahan tingkat Provinsi Jawa Barat 2023." },
    { judul: "Inovasi \"Mata Dewa\"", isi: "Aplikasi layanan desa buatan kader lokal yang mempermudah warga mengurus administrasi, ditiru desa lain di Jabar." },
    { judul: "11 Inovasi Desa", isi: "Selama dua tahun mencatatkan 11 inovasi bidang pemerintahan, kewilayahan, dan kemasyarakatan." },
];

export default async function PublicHomePage() {
    const [totalPengguna, ktp, sktm, skl, skk, sku, skd, pindah, kk] = await Promise.all([
        prisma.user.count(),
        prisma.permohonanKTP.count(),
        prisma.permohonanSKTM.count(),
        prisma.permohonanSKL.count(),
        prisma.permohonanSKK.count(),
        prisma.permohonanSKU.count(),
        prisma.permohonanSKD.count(),
        prisma.permohonanPindah.count(),
        prisma.permohonanKK.count(),
    ]);
    const totalPermohonan = ktp + sktm + skl + skk + sku + skd + pindah + kk;

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
                <div className="relative mx-auto max-w-6xl px-4 py-20 text-center text-white sm:px-6 sm:py-28">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
                        Kecamatan Cibungbulang · Kabupaten Bogor · Jawa Barat
                    </span>
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                        Selamat Datang di Desa Sukamaju
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base opacity-85 sm:text-lg">
                        Portal resmi pelayanan administrasi dan informasi Desa Sukamaju.
                        Melayani warga dengan cepat, transparan, dan akuntabel.
                    </p>
                </div>
            </section>

            {/* STATISTIK RESMI */}
            <section className="border-b bg-muted/40 py-10">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:px-6">
                    {statistikResmi.map((s) => (
                        <div key={s.label} className="rounded-2xl border bg-card p-5 text-center shadow-sm">
                            <p className="text-2xl font-extrabold">{s.value}</p>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* STATISTIK APLIKASI */}
            <section className="py-10">
                <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6">
                    <div className="rounded-xl border bg-card p-5 text-center shadow-sm">
                        <p className="text-2xl font-extrabold">{totalPengguna}</p>
                        <p className="text-sm text-muted-foreground">Warga Terdaftar Online</p>
                    </div>
                    <div className="rounded-xl border bg-card p-5 text-center shadow-sm">
                        <p className="text-2xl font-extrabold">{totalPermohonan}</p>
                        <p className="text-sm text-muted-foreground">Total Permohonan Diproses</p>
                    </div>
                    <div className="col-span-2 rounded-xl border bg-card p-5 text-center shadow-sm sm:col-span-1">
                        <p className="text-2xl font-extrabold">{layanan.length + 1}</p>
                        <p className="text-sm text-muted-foreground">Jenis Layanan Tersedia</p>
                    </div>
                </div>
            </section>

            {/* LAYANAN */}
            <section id="layanan" className="border-t bg-muted/40 py-16">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight">Layanan Administrasi Desa</h2>
                        <p className="mt-4 text-muted-foreground">
                            Untuk mengajukan permohonan, silakan masuk terlebih dahulu.
                            Layanan online mempermudah warga tanpa harus datang ke kantor desa.
                        </p>
                    </div>
                    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {layanan.map((l) => (
                            <div key={l.nama} className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                                <div className="text-3xl">{l.emoji}</div>
                                <h3 className="mt-3 font-bold">{l.nama}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{l.deskripsi}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 text-center">
                        <Link href="/masuk" className="inline-flex rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5">
                            Masuk untuk Mengajukan Permohonan
                        </Link>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Belum punya akun? Tombol Masuk juga bisa untuk mendaftar.
                        </p>
                    </div>
                </div>
            </section>

            {/* PRESTASI */}
            <section className="py-16">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight">🏆 Prestasi & Inovasi Desa</h2>
                    </div>
                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        {prestasi.map((p) => (
                            <div key={p.judul} className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                                <h4 className="font-bold">{p.judul}</h4>
                                <p className="mt-2 text-sm text-muted-foreground">{p.isi}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PETA */}
            <section className="border-t bg-muted/40 py-16">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight">📍 Lokasi & Wilayah Desa</h2>
                        <p className="mt-4 text-muted-foreground">
                            Jl. K.H Abdul Hamid, Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor 16630
                        </p>
                    </div>
                    <div className="mt-10 overflow-hidden rounded-2xl border shadow-sm">
                        <iframe
                            src="https://www.google.com/maps?q=Sukamaju,Cibungbulang,Bogor&hl=id&z=14&output=embed"
                            className="h-80 w-full sm:h-96"
                            loading="lazy"
                            title="Peta Desa Sukamaju"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
