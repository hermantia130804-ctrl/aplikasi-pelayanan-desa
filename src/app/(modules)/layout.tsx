import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { IdleGuard } from "@/components/idle-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { findCurrentSessionService } from "@/lib/server/services/session";
import { redirect } from "next/navigation";
import { PATHS } from "@/constants/paths";

export default async function ModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentSession = await findCurrentSessionService();
  if (currentSession === null) return redirect(PATHS.SIGN_IN);
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <IdleGuard />
      <AppSidebar variant="inset" user={currentSession.user} />
      <SidebarInset>
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
