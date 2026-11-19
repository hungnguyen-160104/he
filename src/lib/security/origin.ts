import { errors } from "@/lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF / cross-origin protection for cookie-authenticated mutations (ADR-005).
 * - Browsers always send `Origin` on cross-origin POST/PATCH/DELETE; we require it to match the
 *   request host (or an allow-listed app URL).
 * - `Sec-Fetch-Site: cross-site` is rejected outright.
 * - Requests with neither header are non-browser clients (curl/Postman) which cannot ride a
 *   victim's cookies, so they pass this check but still face auth + RBAC.
 * - JSON bodies are additionally required (`requireJson`) so HTML forms cannot forge requests.
 */
export function assertSameOrigin(request: Request, allowedOrigins: string[] = []): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw errors.forbidden("Yêu cầu từ nguồn không hợp lệ.");

  const origin = request.headers.get("origin");
  if (!origin) return;

  const allowed = new Set<string>(allowedOrigins.map(normalizeOrigin).filter((o): o is string => Boolean(o)));
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  const requestOrigin = normalizeOrigin(new URL(request.url).origin);
  if (requestOrigin) allowed.add(requestOrigin);

  if (!allowed.has(normalizeOrigin(origin) ?? "")) throw errors.forbidden("Yêu cầu từ nguồn không hợp lệ.");
}

function normalizeOrigin(value: string): string | null {
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    return null;
  }
}

export function requireJson(request: Request): void {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().startsWith("application/json")) {
    throw errors.badRequest("Content-Type phải là application/json.");
  }
}

/** Only allow same-site relative paths as post-login redirects (no open redirect). */
export function safeRedirectPath(input: unknown, fallback = "/dashboard"): string {
  if (typeof input !== "string") return fallback;
  if (!input.startsWith("/") || input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(input)) return fallback;
  return input.slice(0, 300);
}
