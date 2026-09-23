import { requireAdminPage } from "@/lib/server/guards";

export default async function AdminGuardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <>{children}</>;
}
