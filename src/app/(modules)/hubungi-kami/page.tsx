import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hubungi Kami | Desa Sukamaju",
};

export default function HubungiKamiPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Hubungi Kami</h1>
            <p className="text-sm text-muted-foreground">
              Ada pertanyaan atau kendala? Hubungi kami melalui kanal berikut.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
              <div className="text-3xl">📍</div>
              <h2 className="mt-2 font-semibold">Alamat Kantor Desa</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kantor Desa Sukamaju<br />
                Kecamatan Cibungbulang<br />
                Kabupaten Bogor, Jawa Barat
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
              <div className="text-3xl">🕐</div>
              <h2 className="mt-2 font-semibold">Jam Layanan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Senin - Jumat: 08.00 - 14.00 WIB<br />
                Sabtu - Minggu: Libur<br />
                <span className="text-xs">Layanan online: 24 jam</span>
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
              <div className="text-3xl">📞</div>
              <h2 className="mt-2 font-semibold">Telepon / WhatsApp</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Isi nomor telepon kantor desa di sini<br />
                <span className="text-xs">(edit di file halaman ini)</span>
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
              <div className="text-3xl">📧</div>
              <h2 className="mt-2 font-semibold">Email</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Isi email resmi desa di sini<br />
                <span className="text-xs">(edit di file halaman ini)</span>
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border shadow-sm">
            <iframe
              src="https://www.google.com/maps?q=Sukamaju,Cibungbulang,Bogor&hl=id&z=14&output=embed"
              className="h-72 w-full md:h-80"
              loading="lazy"
              title="Lokasi Kantor Desa Sukamaju"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
