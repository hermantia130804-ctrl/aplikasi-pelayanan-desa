import { requireFullAdminPage } from "@/lib/server/guards";
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireFullAdminPage();
  return <>{children}</>;
}
