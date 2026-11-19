import { findCurrentSessionService } from "@/lib/server/services/session";
import { redirect } from "next/navigation";
export default async function DataWargaLayout({ children }: { children: React.ReactNode }) {
  const session = await findCurrentSessionService();
  if (!session?.user) redirect("/masuk");
  if (session.user.role !== "ADMIN" && session.user.role !== "PETUGAS" && session.user.role !== "RT") {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
