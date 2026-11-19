import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Schema, Types, model, models, type Model } from "mongoose";

/**
 * One-time tokens (email verification / password reset). Only the SHA-256 hash is stored;
 * the plaintext is sent once by email and never logged. TTL index purges expired tokens.
 */
export const TOKEN_PURPOSES = ["VERIFY_EMAIL", "RESET_PASSWORD"] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

type AuthTokenDoc = {
  userId: Types.ObjectId;
  tokenHash: string;
  purpose: TokenPurpose;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

const authTokenSchema = new Schema<AuthTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    purpose: { type: String, enum: TOKEN_PURPOSES, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { collection: "auth_tokens", timestamps: { createdAt: true, updatedAt: false } },
);
authTokenSchema.index({ tokenHash: 1 }, { unique: true });
authTokenSchema.index({ userId: 1, purpose: 1 });
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthTokenModel: Model<AuthTokenDoc> =
  (models.AuthToken as Model<AuthTokenDoc> | undefined) ?? model<AuthTokenDoc>("AuthToken", authTokenSchema);

export const TOKEN_TTL_MINUTES: Record<TokenPurpose, number> = { VERIFY_EMAIL: 24 * 60, RESET_PASSWORD: 30 };

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a token, invalidating previous unused tokens of the same purpose for the user. */
export async function issueToken(userId: Types.ObjectId | string, purpose: TokenPurpose): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await AuthTokenModel.updateMany({ userId, purpose, usedAt: null }, { $set: { usedAt: now } });
  await AuthTokenModel.create({
    userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + TOKEN_TTL_MINUTES[purpose] * 60_000),
  });
  return token;
}

/** Atomically mark a valid token as used; returns its userId or null. */
export async function consumeToken(token: string, purpose: TokenPurpose): Promise<Types.ObjectId | null> {
  const now = new Date();
  const doc = await AuthTokenModel.findOneAndUpdate(
    { tokenHash: hashToken(token), purpose, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { projection: { userId: 1 } },
  ).lean();
  return doc?.userId ?? null;
}
