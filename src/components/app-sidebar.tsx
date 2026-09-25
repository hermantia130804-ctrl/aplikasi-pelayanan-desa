"use client";

import {
  IconInnerShadowTop
} from "@tabler/icons-react";
import * as React from "react";

import { AppSidebarUser } from "@/components/app-sidebar-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { MENU } from "@/constants/menu";
import { PATHS } from "@/constants/paths";
import Link from "next/link";
import { AppSidebarMenu } from "./app-sidebar-menu";
import { AppSidebarFooter } from "./app-sidebar-footer";
import { User } from "@/generated/prisma";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: Omit<User, "password">;
};

export const AppSidebar = ({ user, ...props }: AppSidebarProps) => {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={PATHS.HOME}>
                <img src="/logo-kab-bogor.png" alt="Logo Kab. Bogor" className="!size-8 object-contain" />
                <span className="text-base font-semibold">Desa Sukamaju</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarMenu title="Dashboard" items={MENU.MAIN} user={user} />
        <AppSidebarMenu title={(role) => (role === "ADMIN" ? "Admin" : "Petugas")} items={MENU.ADMIN} user={user} />
        <AppSidebarMenu title="Masyarakat" items={MENU.USER} user={user} />
        <AppSidebarFooter items={MENU.FOOTER} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
