import { redirect } from "next/navigation";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { AuthTabs } from "@/components/auth-tabs";
import { findCurrentSessionService } from "@/lib/server/services/session";

export const dynamic = "force-dynamic";

export default async function MasukPage() {
  const session = await findCurrentSessionService();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="absolute z-50 top-5 right-5">
        <ModeToggle />
      </div>
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <img src="/logo-kab-bogor.png" alt="Logo Kab. Bogor" className="size-9 object-contain" />
            Desa Sukamaju
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <AuthTabs />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image src="/login-desk.jpg" alt="Kantor Desa Sukamaju" fill priority className="object-cover" />
      </div>
    </div>
  );
}
