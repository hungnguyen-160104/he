"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type Role } from "@/modules/users/roles";
import { areaLinksForRole } from "./nav-config";
import { NavIcon } from "./nav-icon";

export type HeaderUser = { displayName: string; role: Role };

export function UserMenu({ user }: { user: HeaderUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2" aria-label="Tài khoản">
          <UserCircle2 className="size-5" aria-hidden="true" />
          <span className="hidden max-w-32 truncate sm:inline">{user.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{user.displayName}</span>
          <span className="text-xs font-normal text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {areaLinksForRole(user.role).map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <NavIcon name={item.icon} className="size-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/" })}>
          <LogOut className="size-4" aria-hidden="true" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
