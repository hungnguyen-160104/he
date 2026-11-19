import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopNav, MobileNav } from "./header-nav";
import { PUBLIC_NAV, areaLinksForRole } from "./nav-config";
import { UserMenu, type HeaderUser } from "./user-menu";

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 supports-[backdrop-filter]:bg-card/80 supports-[backdrop-filter]:backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-primary">
          <GraduationCap className="size-6" aria-hidden="true" />
          <span>ExamHub THPT</span>
        </Link>
        <DesktopNav items={PUBLIC_NAV} />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/dang-nhap">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/dang-ky">Đăng ký</Link>
              </Button>
            </>
          )}
          <MobileNav
            items={PUBLIC_NAV}
            extra={user ? areaLinksForRole(user.role) : [{ href: "/dang-nhap", label: "Đăng nhập", icon: "user" }]}
          />
        </div>
      </div>
    </header>
  );
}
