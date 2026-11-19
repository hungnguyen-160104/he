"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";
import { isActivePath } from "./header-nav";
import type { NavItem } from "./nav-config";

/** Routes where the area navigation is hidden on small screens so the content gets the whole viewport. */
const FOCUS_ROUTES = ["/lam-bai/"];

/**
 * Area layout for student / teacher / admin sections.
 * Desktop: left sidebar. Mobile: horizontally scrollable tab bar (no page overflow).
 */
export function AreaShell({ title, items, children }: { title: string; items: NavItem[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  // Most specific match wins so "/quan-tri" is not highlighted on "/quan-tri/nguoi-dung".
  const active = items
    .filter((i) => isActivePath(pathname, i.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const focusMode = FOCUS_ROUTES.some((r) => pathname.startsWith(r));

  // Mobile tab bar: bring the active tab into view (horizontal scroll only — never moves the page).
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const link = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!link) return;
    nav.scrollLeft = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
  }, [active]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-3 md:flex-row md:gap-8 md:py-8">
      <aside className={cn("md:w-56 md:shrink-0", focusMode && "hidden md:block")}>
        <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">{title}</p>
        <nav
          ref={navRef}
          aria-label={title}
          className="scrollbar-none -mx-4 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] md:mx-0 md:overflow-visible md:px-0 md:[mask-image:none]"
        >
          <ul className="flex gap-1 pr-6 md:flex-col md:pr-0">
            {items.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active === item.href ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    active === item.href && "bg-accent text-accent-foreground",
                  )}
                >
                  <NavIcon name={item.icon} className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
