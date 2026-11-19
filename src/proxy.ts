import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect only (no DB): if a protected page is requested without any session
 * cookie, send the user to login with a safe callbackUrl. Real authorization happens on the
 * server (layouts/pages/services) — this is UX, not security.
 */
const SESSION_COOKIES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  const url = request.nextUrl.clone();
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/dang-nhap";
  url.search = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/luyen-tap/:path*",
    "/lam-bai/:path*",
    "/ket-qua/:path*",
    "/lich-su/:path*",
    "/ho-so/:path*",
    "/giao-vien/:path*",
    "/quan-tri/:path*",
  ],
};
