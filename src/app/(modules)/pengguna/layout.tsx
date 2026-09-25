import { requireFullAdminPage } from "@/lib/server/guards";

export default async function FullAdminGuardLayout({ children }: { children: React.ReactNode }) {
  await requireFullAdminPage();
  return <>{children}</>;
}
