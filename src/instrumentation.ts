/**
 * Fail-fast environment validation at server start (Node.js runtime only).
 * Malformed variables stop a production server; in development we log a clear warning so the
 * UI can still render "chưa cấu hình" states.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getEnv, EnvValidationError } = await import("@/lib/env");
  try {
    const env = getEnv();
    const missing: string[] = [];
    if (!env.MONGODB_URI) missing.push("MONGODB_URI");
    if (!env.AUTH_SECRET && !env.NEXTAUTH_SECRET) missing.push("AUTH_SECRET");
    if (env.UNLIMITED_MODE) {
      console.warn(
        env.isProduction
          ? "[examhub] UNLIMITED_MODE=true bị BỎ QUA ở production — các giới hạn vẫn được áp dụng."
          : "[examhub] UNLIMITED_MODE đang bật (chỉ local): đề không đếm giờ, tắt giới hạn số bài làm dở và rate limit.",
      );
    }
    if (missing.length) {
      console.warn(`[examhub] Thiếu cấu hình: ${missing.join(", ")}. Xem .env.example và README.`);
    }
  } catch (err) {
    if (err instanceof EnvValidationError) {
      console.error(`[examhub] ${err.message}`);
      if (process.env.NODE_ENV === "production") throw err;
      return;
    }
    throw err;
  }
}
