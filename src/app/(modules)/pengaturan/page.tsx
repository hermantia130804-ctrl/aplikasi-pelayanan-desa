import { Badge } from "@/components/ui/badge";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { findUserByIdService } from "@/lib/server/services/user";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan | Aplikasi Pelayanan Desa Sukamaju",
};

export default async function PengaturanPage() {
  const session = await findCurrentSessionService();
  if (!session?.user) redirect("/masuk");

  const user = await findUserByIdService(session.user.userId);
  if (!user?.data) redirect("/masuok".slice(0, 5) + "k");

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Pengaturan Akun</h1>
            <p className="text-sm text-muted-foreground">Informasi akun Anda saat ini.</p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
            <h2 className="font-semibold">👤 Profil Akun</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{user.data.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.data.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">NIK</span>
                <span className="font-medium">{user.data.nik}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="outline">{user.data.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Akun</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  {user.data.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm md:p-6">
            <h2 className="font-semibold">🔐 Keamanan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Untuk mengganti password, gunakan menu <b>"Lupa Password"</b> pada halaman login
              setelah keluar dari akun. Fitur ubah password langsung sedang dikembangkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
