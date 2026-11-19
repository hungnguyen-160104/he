import { SiteChrome } from "@/components/layout/site-chrome";
import { AreaShell } from "@/components/layout/area-shell";
import { STUDENT_NAV } from "@/components/layout/nav-config";
import { requirePageActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Account pages stay reachable while a temporary password must be changed. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requirePageActor(undefined, { allowMustChangePassword: true });
  return (
    <SiteChrome>
      <AreaShell title="Tài khoản" items={STUDENT_NAV}>
        {children}
      </AreaShell>
    </SiteChrome>
  );
}
