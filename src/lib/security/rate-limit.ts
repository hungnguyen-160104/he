import "server-only";
import { createHash } from "node:crypto";
import { Schema, model, models, type Model } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { getEnv, isUnlimitedMode } from "@/lib/env";

/**
 * Free-tier rate limiting: fixed-window counters in MongoDB, incremented atomically with an
 * upsert, auto-deleted by a TTL index. Keys are SHA-256 hashed so no IP/email is stored.
 */
type RateLimitDoc = { key: string; count: number; expiresAt: Date };

const rateLimitSchema = new Schema<RateLimitDoc>(
  {
    key: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { collection: "rate_limits", versionKey: false },
);
rateLimitSchema.index({ key: 1 }, { unique: true });
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitModel: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc> | undefined) ?? model<RateLimitDoc>("RateLimit", rateLimitSchema);

export type RateLimitRule = { scope: string; limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  loginByIp: { scope: "login-ip", limit: 30, windowSeconds: 15 * 60 },
  loginByIdentifier: { scope: "login-id", limit: 10, windowSeconds: 15 * 60 },
  registerByIp: { scope: "register-ip", limit: 10, windowSeconds: 60 * 60 },
  passwordResetByIp: { scope: "reset-ip", limit: 10, windowSeconds: 60 * 60 },
  passwordResetByEmail: { scope: "reset-email", limit: 3, windowSeconds: 60 * 60 },
  changePasswordByUser: { scope: "change-pw", limit: 10, windowSeconds: 15 * 60 },
  adminMutationByUser: { scope: "admin-mut", limit: 120, windowSeconds: 60 },
  uploadByUser: { scope: "upload", limit: 30, windowSeconds: 10 * 60 },
  attemptStartByUser: { scope: "attempt-start", limit: 30, windowSeconds: 10 * 60 },
  submitByUser: { scope: "submit", limit: 60, windowSeconds: 10 * 60 },
  autosaveByUser: { scope: "autosave", limit: 600, windowSeconds: 10 * 60 },
} satisfies Record<string, RateLimitRule>;

function hashKey(input: string): string {
  return createHash("sha256").update(input).digest("base64url").slice(0, 32);
}

/** Increment and enforce. Throws RATE_LIMITED (429) with Retry-After when exceeded. */
export async function enforceRateLimit(rule: RateLimitRule, subject: string, now = Date.now()): Promise<void> {
  if (isUnlimitedMode()) return; // local testing only (always off in production)
  await connectToDatabase();
  const windowMs = rule.windowSeconds * 1000;
  const bucket = Math.floor(now / windowMs);
  const key = `${rule.scope}:${bucket}:${hashKey(subject)}`;
  const expiresAt = new Date((bucket + 1) * windowMs);

  const bump = () =>
    RateLimitModel.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after", projection: { count: 1 } },
    ).lean();

  let doc: { count: number } | null;
  try {
    doc = await bump();
  } catch (err) {
    // Concurrent upsert race on the unique key: the other insert won, retry as an update.
    if ((err as { code?: number }).code === 11000) doc = await bump();
    else throw err;
  }
  if (doc && doc.count > rule.limit * getEnv().RATE_LIMIT_MULTIPLIER) {
    throw errors.rateLimited(Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)));
  }
}

/** Best-effort client IP (Vercel sets x-forwarded-for; first entry is the client). */
export function clientIpFrom(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    const v = headers[name];
    return Array.isArray(v) ? v[0] : v;
  };
  const xff = get("x-forwarded-for");
  return (xff?.split(",")[0]?.trim() || get("x-real-ip") || "unknown").slice(0, 64);
}
