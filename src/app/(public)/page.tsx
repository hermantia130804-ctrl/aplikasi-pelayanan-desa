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
                        <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                            Desa Sukamaju
                        </span>
                    </h1>

                    <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Portal resmi pelayanan administrasi dan informasi Desa Sukamaju —
                        melayani warga dengan cepat, transparan, dan akuntabel.
                    </p>

