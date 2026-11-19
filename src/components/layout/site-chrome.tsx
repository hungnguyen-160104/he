import { getHeaderUser } from "@/lib/auth/session";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const user = await getHeaderUser();
  return (
    <>
      <SiteHeader user={user} />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
