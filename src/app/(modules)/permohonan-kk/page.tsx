import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Permohonan KK | Aplikasi Pelayanan Desa Sukamaju",
  description: "Kelola Permohonan KK - Aplikasi Pelayanan Desa Sukamaju",
};

export default function KKRequestPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Kelola Permohonan KK</h1>
            <p className="text-muted-foreground">
              Permohonan KK adalah permohonan KK yang dilakukan oleh warga desa
              Sukamaju yang memiliki KK.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
