import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "katex/dist/katex.min.css";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ExamHub THPT — Luyện thi tốt nghiệp THPT", template: "%s | ExamHub THPT" },
  description: "Ôn tập theo chủ đề, thi thử có đếm giờ và bảng xếp hạng theo môn cho học sinh THPT.",
  applicationName: "ExamHub THPT",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content (and our fixed bottom bars) use env(safe-area-inset-*) on notched phones.
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. ones adding class "mdl-js", Grammarly
    // attributes) mutate <html>/<body> before hydration. This only ignores attribute diffs on
    // these two elements themselves — mismatches deeper in the tree are still reported.
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Bỏ qua điều hướng
        </a>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
