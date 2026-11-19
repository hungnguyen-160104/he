import { SiteChrome } from "@/components/layout/site-chrome";
import { AreaShell } from "@/components/layout/area-shell";
import { TEACHER_NAV } from "@/components/layout/nav-config";
import { requirePageActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requirePageActor(["TEACHER", "ADMIN"]);
  return (
    <SiteChrome>
      <AreaShell title="Khu vực giáo viên" items={TEACHER_NAV}>
        {children}
      </AreaShell>
    </SiteChrome>
  );
}
