"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { PATHS } from "@/constants/paths"
import { User } from "@/generated/prisma"
import { signOutAction } from "@/lib/server/actions/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type AppSidebarUserProps = {
  user: Omit<User, "password">;
}

export const AppSidebarUser = ({
  user,
}: AppSidebarUserProps) => {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const parseFallback = () => {
    const name = user.name.split(" ");
    return name[0][0] + name[name.length - 1][0];
  }

  // Foto profil user dari database (Vercel Blob URL).
  // Jika user belum upload foto, pakai AvatarFallback (inisial nama).
  const fotoProfilUrl = user.foto ?? "";

  const handleLogout = async () => {
    try {
      const result = await signOutAction();
      if (result.status === 200) {
        toast.success(result.message);
        router.push("/");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Avatar: pakai foto profil user dari DB, bukan URL hardcoded shadcn.
                  - object-cover dipasang lewat className AvatarImage supaya foto utuh & jelas.
                  - Class 'grayscale' dihapus agar foto tampil dengan warna asli. */}
              <Avatar className="h-9 w-9 rounded-lg overflow-hidden ring-1 ring-border/50">
                <AvatarImage
                  src={fotoProfilUrl}
                  alt={user.name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  {parseFallback()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-lg overflow-hidden ring-1 ring-border/50">
                  <AvatarImage
                    src={fotoProfilUrl}
                    alt={user.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    {parseFallback()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
