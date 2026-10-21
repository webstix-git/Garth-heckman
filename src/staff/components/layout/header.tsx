"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { logout } from "@/services/auth";
import type { AdminUser } from "@/types";

interface HeaderProps {
  user: AdminUser | null;
  headerColor: string;
  onMenuClick: () => void;
  onToggleCollapsed: () => void;
}

export function Header({ user, headerColor, onMenuClick, onToggleCollapsed }: HeaderProps) {
  const router = useRouter();

  async function onLogout() {
    await logout();
    toast.success("Signed out");
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header
      data-admin-header
      className="sticky top-0 z-30 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-3 text-white shadow-sm sm:px-4"
      style={{ backgroundColor: headerColor, borderColor: headerColor }}
    >
      <div className="flex min-w-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden text-white hover:bg-white/10 hover:text-white md:inline-flex"
          aria-label="Toggle sidebar"
          onClick={onToggleCollapsed}
        >
          <Menu />
        </Button>
      </div>

      <div className="hidden justify-center md:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1">
        <div className="text-white [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
          <ThemeToggle />
        </div>
        <NotificationsPopover />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-8 gap-2 px-1.5 text-white hover:bg-white/10 hover:text-white sm:px-2" />
            }
          >
            <Avatar size="sm">
              <AvatarImage
                src={user?.avatar || undefined}
                alt={user?.username ?? "admin"}
              />
              <AvatarFallback>{initials(user?.username ?? "admin")}</AvatarFallback>
            </Avatar>
            <span className="hidden text-[13px] sm:inline">
              {user?.username ?? "admin"}
            </span>
            <ChevronDown className="hidden size-3.5 sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user?.username ?? "admin"}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/admin/profile" />}>
              <User /> Admin Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/admin/settings" />}>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void onLogout()}>
              <LogOut /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
