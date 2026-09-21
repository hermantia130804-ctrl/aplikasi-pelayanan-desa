"use client";

import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Role, User } from "@/generated/prisma";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type AppSidebarMenuProps = {
  user: Omit<User, "password">;
  title: string;
  items: {
    name: string;
    url: string;
    icon: Icon;
    roles: Role[];
  }[];
};

export const AppSidebarMenu = ({ title, items, user }: AppSidebarMenuProps) => {
  const pathname = usePathname().split("/")[1];

  const checkActiveMenu = (url: string) => {
    return pathname === url.split("/")[1];
  };

  const filterItems = () => {
    return items.filter((item) => item.roles.includes(user.role));
  };

  return (
    <SidebarGroup className={cn("group-data-[collapsible=icon]:hidden", { "hidden": filterItems().length === 0 })}>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {filterItems().map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton asChild isActive={checkActiveMenu(item.url)}>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
