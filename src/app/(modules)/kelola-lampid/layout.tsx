import { requireAdminPage } from "@/lib/server/guards";

export default async function KelolaLampidLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <>{children}</>;
}
