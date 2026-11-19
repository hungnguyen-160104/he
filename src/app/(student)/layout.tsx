import { SiteChrome } from "@/components/layout/site-chrome";
import { AreaShell } from "@/components/layout/area-shell";
import { STUDENT_NAV } from "@/components/layout/nav-config";
import { requirePageActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Any signed-in role may study; staff attempts are excluded from rankings in the service layer. */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requirePageActor();
  return (
    <SiteChrome>
      <AreaShell title="Góc học tập" items={STUDENT_NAV}>
        {children}
      </AreaShell>
    </SiteChrome>
  );
}
