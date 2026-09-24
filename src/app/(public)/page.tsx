import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ArrowRight, ShieldCheck, MapPin, Phone, Users, Map, Landmark } from "lucide-react";

export const dynamic = "force-dynamic";

const statistikResmi = [
    { label: "Jiwa Penduduk", value: "9.713" },
    { label: "Luas Wilayah", value: "±200 Ha" },
    { label: "Dusun · RW · RT", value: "3 · 9 · 26" },
];

const layanan = [
    { emoji: "🪪", nama: "Kartu Tanda Penduduk", singkat: "KTP", deskripsi: "Pengajuan KTP baru, perubahan data, dan penggantian." },
    { emoji: "👨‍👩‍👧‍👦", nama: "Kartu Keluarga", singkat: "KK", deskripsi: "Pengajuan dan perubahan data Kartu Keluarga." },
    { emoji: "👶", nama: "Keterangan Kelahiran", singkat: "SKL", deskripsi: "Surat keterangan kelahiran anak warga desa." },
    { emoji: "🤝", nama: "Tidak Mampu", singkat: "SKTM", deskripsi: "Surat keterangan tidak mampu untuk berbagai keperluan." },
    { emoji: "🕯️", nama: "Keterangan Kematian", singkat: "SKK", deskripsi: "Surat keterangan kematian warga desa." },
    { emoji: "🏪", nama: "Keterangan Usaha", singkat: "SKU", deskripsi: "Surat keterangan usaha untuk perizinan." },
    { emoji: "📍", nama: "Keterangan Domisili", singkat: "SKD", deskripsi: "Surat keterangan domisili warga desa." },
];

const prestasi = [
    { nomor: "01", judul: "5 Besar Lomba Desa Jabar 2023", isi: "Mewakili Kabupaten Bogor di Lomba Desa & Kelurahan tingkat Provinsi Jawa Barat (SK Bupati No. 400.10/248/Kpts/Per)." },
    { nomor: "02", judul: "Inovasi \"Mata Dewa\"", isi: "Aplikasi layanan desa buatan kader lokal yang mempermudah warga mengurus administrasi — ditiru desa lain di Jabar." },
    { nomor: "03", judul: "11 Inovasi Desa", isi: "Dua tahun konsisten mencatatkan 11 inovasi bidang pemerintahan, kewilayahan, dan kemasyarakatan." },
];

const keunggulan = [
    { judul: "Gotong Royong yang Hidup", isi: "Kerja bakti rutin, siskamling, dan kegiatan sosial antarwarga tetap menjadi napas kehidupan desa." },
    { judul: "Tanah Subur", isi: "Sawah dan kebun menopang ekonomi mayoritas keluarga — pertanian adalah tulang punggung desa." },
    { judul: "Sumber Air Melimpah", isi: "Mata air dan aliran sungai bersih menopang irigasi serta kebutuhan warga sehari-hari." },
    { judul: "Harmoni dalam Keberagaman", isi: "Warga rukun lintas kegiatan keagamaan dan adat — musyawarah adalah jalan setiap persoalan." },
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
            {/* ============ HERO ============ */}
            <section className="relative min-h-[92svh] overflow-hidden">
                <Image
                    src="/login-desk.jpg"
                    alt="Kantor Desa Sukamaju"
                    fill priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/55 to-background" />
                <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)]" />

                <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col items-center justify-center px-4 py-28 text-center sm:px-6">
                    <div className="relative mb-10">
                        <div className="absolute -inset-6 rounded-full bg-primary/20 blur-2xl" />
                        <Image
                            src="/logo-kab-bogor.png"
                            alt="Lambang Kabupaten Bogor"
                            width={96}
                            height={96}
                            className="relative size-20 object-contain drop-shadow-2xl sm:size-24"
                        />
                    </div>

                    <span className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/40 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] backdrop-blur-md">
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                        </span>
                        Kecamatan Cibungbulang · Kabupaten Bogor
                    </span>

                    <h1 className="mt-8 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                        Selamat Datang di{" "}
                        <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Desa Sukamaju</span>
                     </h1>
                    <p className="mx-auto mt-8 max-w-2xl text-base font-medium leading-relaxed text-foreground/85 sm:text-lg">
                        Portal resmi pelayanan administrasi dan informasi Desa Sukamaju —
                        melayani warga dengan cepat, transparan, dan akuntabel.
                    </p>


                    <div className="mt-10 inline-flex items-center gap-2 text-xs text-foreground/75">
                        <ShieldCheck className="size-4 text-emerald-500" />
                        Data resmi portal Pemerintah Kabupaten Bogor · diperbarui September 2026
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-muted-foreground/40 p-1.5">
                        <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                    </div>
                </div>
            </section>

            {/* ============ STATISTIK RESMI ============ */}
            <section className="border-y bg-muted/30">
                <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 px-4 sm:px-6">
                    {statistikResmi.map((s) => (
                        <div key={s.label} className="flex flex-col items-center gap-1 py-8">
                            <span className="text-4xl font-black tracking-tight sm:text-5xl">{s.value}</span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ TENTANG SINGKAT ============ */}
            <section className="py-24">
                <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
                            Profil Desa
                        </span>
                        <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                            Desa Cepat Berkembang dengan Jiwa Gotong Royong yang Kuat
                        </h2>
                        <p className="mt-6 leading-relaxed text-muted-foreground">
                            Desa Sukamaju adalah salah satu dari 15 desa di Kecamatan Cibungbulang,
                            Kabupaten Bogor — sekitar 15 km dari pusat kabupaten, dengan udara sejuk
                            dataran tinggi dan mayoritas wilayah persawahan serta perkebunan milik warga.
                        </p>
                        <p className="mt-4 leading-relaxed text-muted-foreground">
                            Nama <b>Sukamaju</b> bermakna harapan agar seluruh warganya hidup dalam
                            keadaan <i>suka dan maju</i> — ekonomi ditopang pertanian, perkebunan,
                            peternakan, serta tumbuhnya usaha mikro masyarakat.
                        </p>
                        <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border bg-card p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kode Pos</p>
                                <p className="mt-1 font-bold">16630</p>
                            </div>
                            <div className="rounded-xl border bg-card p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kode Wilayah</p>
                                <p className="mt-1 font-bold">32.01.16.2013</p>
                            </div>
                            <div className="rounded-xl border bg-card p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Koordinat</p>
                                <p className="mt-1 font-bold">6°35′12″LS 106°39′10″BT</p>
                            </div>
                            <div className="rounded-xl border bg-card p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                                <p className="mt-1 font-bold">Desa Cepat Berkembang</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {keunggulan.map((k, i) => (
                            <div
                                key={k.judul}
                                className={`rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                    i % 2 === 1 ? "sm:translate-y-6" : ""
                                }`}
                            >
                                <span className="mb-4 block h-1 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                                <h3 className="font-bold">{k.judul}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{k.isi}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ STATISTIK APLIKASI ============ */}
            <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground">
                <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_120%,rgba(255,255,255,0.12),transparent)]" />
                <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-70">
                            Layanan Digital Desa
                        </span>
                        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                            Administrasi Kini dalam Genggaman
                        </h2>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {[
                            { icon: Users, label: "Warga Terdaftar Online", value: totalPengguna },
                            { icon: Landmark, label: "Permohonan Diproses", value: totalPermohonan },
                            { icon: Map, label: "Jenis Layanan", value: layanan.length },
                        ].map((s) => (
                            <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur-md">
                                <s.icon className="mx-auto size-7 opacity-80" />
                                <p className="mt-4 text-4xl font-black">{s.value}</p>
                                <p className="mt-1 text-sm opacity-70">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ LAYANAN ============ */}
            <section id="layanan" className="py-24">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
                            Layanan Administrasi
                        </span>
                        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                            Tujuh Surat, Satu Pintu
                        </h2>
                        <p className="mt-4 text-muted-foreground">
                            Untuk mengajukan permohonan, masuk terlebih dahulu — prosesnya cepat,
                            statusnya dapat dipantau, dan hasilnya surat resmi.
                        </p>
                    </div>

                    <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {layanan.map((l, i) => (
                            <div
                                key={l.nama}
                                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5"
                            >
                                <span className="absolute right-4 top-4 text-4xl font-black text-muted-foreground/10">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <div className="text-3xl">{l.emoji}</div>
                                <h3 className="mt-4 font-bold">{l.nama}</h3>
                                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                    {l.singkat}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.deskripsi}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <Link
                            href="/masuk"
                            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Masuk untuk Mengajukan Permohonan
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Belum punya akun? Daftar melalui tombol yang sama.
                        </p>
                    </div>
                </div>
            </section>

            {/* ============ PRESTASI ============ */}
            <section className="border-t bg-muted/30 py-24">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-600">
                            Prestasi & Inovasi
                        </span>
                        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                            Jejak Karya yang Diakui
                        </h2>
                    </div>
                    <div className="mt-14 grid gap-6 md:grid-cols-3">
                        {prestasi.map((p) => (
                            <div key={p.nomor} className="group relative rounded-2xl border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                                <span className="text-5xl font-black text-muted-foreground/15">{p.nomor}</span>
                                <h3 className="mt-4 font-bold leading-snug">{p.judul}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.isi}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ PETA + KONTAK ============ */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
                            Lokasi & Kontak
                        </span>
                        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                            Temukan Kami
                        </h2>
                    </div>
                    <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_340px]">
                        <div className="overflow-hidden rounded-2xl border shadow-sm">
                            <iframe
                                src="https://www.google.com/maps?q=Sukamaju,Cibungbulang,Bogor&hl=id&z=14&output=embed"
                                className="h-80 w-full sm:h-[420px]"
                                loading="lazy"
                                title="Peta Desa Sukamaju"
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            {[
                                { icon: MapPin, judul: "Alamat Kantor Desa", isi: "Jl. K.H Abdul Hamid, Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor 16630" },
                                { icon: Phone, judul: "Telepon / WhatsApp", isi: "+62 812-8569-9854" },
                                { icon: ShieldCheck, judul: "Jam Layanan", isi: "Senin – Jumat, 08.00 – 14.00 WIB" },
                            ].map((c) => (
                                <div key={c.judul} className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <c.icon className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.judul}</p>
                                        <p className="mt-1 text-sm font-medium leading-relaxed">{c.isi}</p>
                                    </div>
                                </div>
                            ))}
                            <Link
                                href="/masuk"
                                className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold transition-all hover:bg-muted"
                            >
                                Masuk ke Aplikasi Layanan
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
