// File: src/app/(public)/layanan-masyarakat/page.tsx
// Halaman "Layanan Masyarakat" — 5 kartu layanan publik.
// Letakkan file ini di: src/app/(public)/layanan-masyarakat/page.tsx
// (route group (public) tidak menghasilkan segmen URL, jadi URL = /layanan-masyarakat)
// Nav "Beranda Masyarakat" ada di src/app/(public)/layout.tsx — format { label, url }.

import {
  HeartPulse,
  HandCoins,
  Briefcase,
  Banknote,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

type Layanan = {
  judul: string;
  deskripsi: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const layanan: Layanan[] = [
  {
    judul: "Cek BPJS Kesehatan",
    deskripsi:
      "Info & pengaduan layanan BPJS Kesehatan via WhatsApp ke nomor desa.",
    // 08118165165 -> internasional: 62 + 8118165165 = 628118165165
    href: "https://wa.me/628118165165?text=Info%20%26%20Pengaduan",
    icon: HeartPulse,
  },
  {
    judul: "Cek Bantuan dan Desil",
    deskripsi:
      "Cek penerima bantuan sosial & peringkat desil (Kementerian Sosial).",
    href: "https://cekbansos.kemensos.go.id",
    icon: HandCoins,
  },
  {
    judul: "BPJS Tenaga Kerja",
    deskripsi:
      "Layanan JKK, JKM, JHT, dan Jaminan Pensiun BPJS Ketenagakerjaan.",
    href: "https://www.bpjsketenagakerjaan.go.id",
    icon: Briefcase,
  },
  {
    judul: "Cek BSU Tenaga Kerja",
    deskripsi:
      "Cek status Bantuan Subsidi Upah (BSU) Kementerian Tenaga Kerja.",
    href: "https://bsu.kemnaker.go.id",
    icon: Banknote,
  },
  {
    judul: "Perlinsos",
    deskripsi:
      "Portal Perlindungan Sosial Kemensos — daftar & cek bantuan sosial.",
    href: "https://perlinsos.kemensos.go.id",
    icon: ShieldCheck,
  },
];

export default function LayananMasyarakatPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Layanan Masyarakat</h1>
            <p className="text-muted-foreground">
              Akses cepat berbagai layanan publik: BPJS Kesehatan, BPJS
              Ketenagakerjaan, Bantuan Sosial, BSU, dan Perlindungan Sosial.
              Pilih kartu layanan untuk membuka situs atau aplikasi terkait.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layanan.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.judul}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition hover:shadow-md hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold">{item.judul}</h2>
                    <p className="text-sm text-muted-foreground">
                      {item.deskripsi}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
