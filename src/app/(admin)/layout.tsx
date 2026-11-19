import { SiteChrome } from "@/components/layout/site-chrome";
import { AreaShell } from "@/components/layout/area-shell";
import { ADMIN_NAV } from "@/components/layout/nav-config";
import { requirePageActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageActor(["ADMIN"]);
  return (
    <SiteChrome>
      <AreaShell title="Quản trị" items={ADMIN_NAV}>
        {children}
      </AreaShell>
    </SiteChrome>
  );
}
