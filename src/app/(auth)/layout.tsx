import { SiteChrome } from "@/components/layout/site-chrome";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteChrome>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">{children}</div>
    </SiteChrome>
  );
}
