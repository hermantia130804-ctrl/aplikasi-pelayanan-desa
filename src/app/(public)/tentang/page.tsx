import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang | Desa Sukamaju",
};

export default function TentangPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Tentang Aplikasi</h1>
            <p className="text-sm text-muted-foreground">Aplikasi Pelayanan Desa Sukamaju</p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
            <h2 className="font-semibold">💡 Tentang Aplikasi</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Aplikasi Pelayanan Desa Sukamaju adalah sistem informasi satu pintu
              untuk layanan administrasi kependudukan di Desa Sukamaju, Kecamatan
              Cibungbulang, Kabupaten Bogor. Aplikasi ini memudahkan warga untuk
              mengajukan surat administrasi secara online, melacak status
              permohonan, dan mendapatkan informasi desa — tanpa perlu datang
              langsung ke kantor desa.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
            <h2 className="font-semibold">✨ Fitur Utama</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>📝 <b>Pengajuan Online</b> — ajukan surat kapan saja dari perangkat apa pun</li>
              <li>📤 <b>Upload Dokumen</b> — lampirkan scan persyaratan dalam format PDF</li>
              <li>🔔 <b>Notifikasi</b> — petugas desa langsung menerima pemberitahuan permohonan baru</li>
              <li>📊 <b>Pantau Status</b> — warga dapat melihat status permohonan real-time</li>
              <li>🔐 <b>Akun Aman</b> — verifikasi email dan manajemen sesi yang baik</li>
            </ul>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
            <h2 className="font-semibold">🏢 Profil Desa</h2>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>📍 Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor, Jawa Barat</li>
              <li>🏘️ RW: 8 • RT: 24</li>
              <li>📐 Luas Wilayah: ±425 Ha</li>
              <li>👥 Jumlah Penduduk: ±12.450 jiwa (2026)</li>
            </ul>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
            <h2 className="font-semibold">ℹ️ Versi Aplikasi</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Versi 1.0 • Dibangun dengan Next.js, PostgreSQL (Neon), dan Vercel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
