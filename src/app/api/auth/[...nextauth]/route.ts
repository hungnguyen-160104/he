import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth/options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// NextAuth handles its own CSRF token for signin/signout.
function handler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  return NextAuth(req as never, ctx as never, getAuthOptions());
}

export { handler as GET, handler as POST };
