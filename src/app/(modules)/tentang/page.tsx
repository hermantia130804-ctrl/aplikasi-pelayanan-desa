import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang | Aplikasi Pelayanan Desa Sukamaju",
};

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Tentang</h1>
            <p className="text-muted-foreground">Halaman ini sedang dalam pengembangan. Fitur akan segera tersedia.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
