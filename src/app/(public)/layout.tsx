import { SiteChrome } from "@/components/layout/site-chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
