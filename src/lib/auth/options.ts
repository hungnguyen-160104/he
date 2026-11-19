import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAuthSecret, getEnv } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { clientIpFrom } from "@/lib/security/rate-limit";
import { authenticate, LOGIN_ERROR } from "@/modules/auth/service";
import { loginSchema } from "@/modules/auth/validation";

const KNOWN_LOGIN_ERRORS = new Set<string>(Object.values(LOGIN_ERROR));

/**
 * NextAuth v4 (ADR-003). JWT session in an HttpOnly cookie (Secure + __Secure- prefix on HTTPS,
 * SameSite=Lax). The JWT only carries uid/role/sessionVersion; every protected request re-reads
 * role/status/sessionVersion from MongoDB (src/lib/auth/session.ts), so locks, role changes and
 * password changes take effect immediately.
 */
export function getAuthOptions(): NextAuthOptions {
  return {
    secret: getAuthSecret(),
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    pages: { signIn: "/dang-nhap", error: "/dang-nhap" },
    useSecureCookies: getEnv().isProduction,
    providers: [
      CredentialsProvider({
        id: "credentials",
        name: "Tài khoản",
        credentials: {
          identifier: { label: "Tên đăng nhập hoặc email", type: "text" },
          password: { label: "Mật khẩu", type: "password" },
        },
        async authorize(credentials, req) {
          const parsed = loginSchema.safeParse({ identifier: credentials?.identifier, password: credentials?.password });
          if (!parsed.success) return null;
          const ip = clientIpFrom((req?.headers ?? {}) as Record<string, string | string[] | undefined>);
          try {
            const user = await authenticate(parsed.data.identifier, parsed.data.password, ip);
            if (!user) return null;
            return { id: user.id, name: user.displayName, role: user.role, sv: user.sessionVersion };
          } catch (err) {
            if (err instanceof Error && KNOWN_LOGIN_ERRORS.has(err.message)) throw err;
            if (isAppError(err) && (err.code === "CONFIG_MISSING" || err.code === "DB_UNAVAILABLE")) throw new Error(err.code);
            logger.error("auth.authorize_failed", { name: err instanceof Error ? err.name : "unknown" });
            throw new Error("DB_UNAVAILABLE");
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.uid = user.id;
          token.role = user.role;
          token.sv = user.sv;
          token.name = user.name;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.uid && token.role && typeof token.sv === "number") {
          session.user = { id: token.uid, role: token.role, name: token.name ?? "", sv: token.sv };
        }
        return session;
      },
    },
    logger: {
      error: (code) => logger.error("nextauth.error", { code }),
      warn: (code) => logger.warn("nextauth.warn", { code }),
      debug: () => undefined,
    },
  };
}
