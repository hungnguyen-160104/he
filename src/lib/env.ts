import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors";

/**
 * Server environment validation.
 * - Malformed values fail fast (instrumentation.ts validates at server start).
 * - Missing *optional integrations* (Cloudinary, mail) never crash the app: callers check
 *   `isCloudinaryConfigured()` etc. and show a clear "chưa cấu hình" message.
 * - Missing MongoDB raises a controlled CONFIG_MISSING (503) at first DB access.
 */

const booleanString = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    MONGODB_URI: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI phải bắt đầu bằng mongodb:// hoặc mongodb+srv://")
        .optional(),
    ),
    MONGODB_DB_NAME: z.preprocess(emptyToUndefined, z.string().regex(/^[A-Za-z0-9_-]{1,38}$/).default("examhub")),
    MONGODB_MAX_POOL_SIZE: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).default(10)),
    MONGODB_AUTO_INDEX: z.preprocess(emptyToUndefined, booleanString.optional()),

    AUTH_SECRET: z.preprocess(emptyToUndefined, z.string().min(32, "AUTH_SECRET cần tối thiểu 32 ký tự").optional()),
    NEXTAUTH_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
    NEXTAUTH_URL: optionalUrl,
    NEXT_PUBLIC_APP_URL: optionalUrl,

    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    CLOUDINARY_UPLOAD_FOLDER: z.preprocess(
      emptyToUndefined,
      z.string().regex(/^[a-z0-9_-]{1,40}$/, "CLOUDINARY_UPLOAD_FOLDER chỉ gồm a-z, 0-9, _ và -").default("examhub"),
    ),

    REQUIRE_EMAIL_VERIFICATION: z.preprocess(emptyToUndefined, booleanString.optional()),
    /** Scales every rate limit (1 = default). Only for load/E2E test environments behind one IP. */
    RATE_LIMIT_MULTIPLIER: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(1)),
    /**
     * LOCAL TESTING ONLY: mock exams are untimed, no cap on open attempts, rate limits disabled.
     * Always IGNORED in production builds/servers (limits stay on) — see isUnlimitedMode().
     */
    UNLIMITED_MODE: z.preprocess(emptyToUndefined, booleanString.default(false)),
    MAIL_PROVIDER: z.preprocess(emptyToUndefined, z.enum(["none", "console", "resend"]).default("none")),
    MAIL_FROM: optionalString,
    RESEND_API_KEY: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && !env.AUTH_SECRET && !env.NEXTAUTH_SECRET) {
      ctx.addIssue({ code: "custom", path: ["AUTH_SECRET"], message: "AUTH_SECRET bắt buộc trong production" });
    }
    if (env.NODE_ENV === "production" && env.MAIL_PROVIDER === "console") {
      ctx.addIssue({ code: "custom", path: ["MAIL_PROVIDER"], message: "MAIL_PROVIDER=console chỉ dùng cho development" });
    }
    if (env.MAIL_PROVIDER === "resend" && (!env.RESEND_API_KEY || !env.MAIL_FROM)) {
      ctx.addIssue({ code: "custom", path: ["RESEND_API_KEY"], message: "MAIL_PROVIDER=resend cần RESEND_API_KEY và MAIL_FROM" });
    }
  });

export type ServerEnv = z.infer<typeof envSchema> & {
  requireEmailVerification: boolean;
  autoIndex: boolean;
  isProduction: boolean;
};

let cached: ServerEnv | null = null;

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Biến môi trường không hợp lệ:\n- ${issues.join("\n- ")}`);
    this.name = "EnvValidationError";
  }
}

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Only variable names + messages; never values.
    throw new EnvValidationError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  }
  const env = parsed.data;
  const isProduction = env.NODE_ENV === "production";
  cached = {
    ...env,
    isProduction,
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION ?? isProduction,
    autoIndex: env.MONGODB_AUTO_INDEX ?? true,
  };
  return cached;
}

/** Test-only: reset memoized env after mutating process.env. */
export function resetEnvCache(): void {
  cached = null;
}

export function getMongoConfig(): { uri: string; dbName: string; maxPoolSize: number; autoIndex: boolean } {
  const env = getEnv();
  if (!env.MONGODB_URI) {
    throw new AppError("CONFIG_MISSING", "Chưa cấu hình cơ sở dữ liệu (MONGODB_URI). Xem README để thiết lập MongoDB Atlas.", 503);
  }
  return { uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME, maxPoolSize: env.MONGODB_MAX_POOL_SIZE, autoIndex: env.autoIndex };
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getEnv().MONGODB_URI);
}

export function getAuthSecret(): string | undefined {
  const env = getEnv();
  return env.AUTH_SECRET ?? env.NEXTAUTH_SECRET;
}

/** Local testing switch: untimed exams, no attempt cap, no rate limits (never in production). */
export function isUnlimitedMode(): boolean {
  const env = getEnv();
  // Never in production: with rate limits off, weak passwords could be brute-forced.
  return env.UNLIMITED_MODE && !env.isProduction;
}

export function isCloudinaryConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export function getAppUrl(): string {
  const env = getEnv();
  return env.NEXT_PUBLIC_APP_URL ?? env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/** Public summary of configuration status — booleans only, never values. */
export function getConfigStatus() {
  const env = getEnv();
  return {
    database: Boolean(env.MONGODB_URI),
    authSecret: Boolean(env.AUTH_SECRET ?? env.NEXTAUTH_SECRET),
    cloudinary: isCloudinaryConfigured(),
    mail: env.MAIL_PROVIDER !== "none",
    mailProvider: env.MAIL_PROVIDER,
    requireEmailVerification: env.requireEmailVerification,
  };
}
