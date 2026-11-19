import "server-only";
import { hash, verify, type Algorithm } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";

/**
 * Argon2id with OWASP-recommended minimum parameters (m=19 MiB, t=2, p=1). Prebuilt N-API
 * binary (no node-gyp) — works on Vercel Node.js functions. Async: does not block the event loop.
 */
const ARGON2ID = 2 as Algorithm; // Algorithm.Argon2id (ambient const enum; isolatedModules-safe)
const OPTIONS = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | null = null;
/** Run a verify against a fixed hash when the account does not exist (timing equalization). */
export async function verifyDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(await dummyHash, password);
}

/** Temporary password for admin-created / admin-reset accounts (shown once, must be changed). */
export function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 7)}-${out.slice(7)}`;
}
