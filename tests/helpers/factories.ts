import { UserModel } from "@/modules/users/model";
import { hashPassword } from "@/modules/auth/password";
import type { Actor } from "@/modules/users/permissions";
import type { Role } from "@/modules/users/roles";

export const TEST_PASSWORD = "Mat khau thu 2026";
let hashed: Promise<string> | null = null;

export async function createUser(opts: { username: string; role?: Role; email?: string; status?: "ACTIVE" | "SUSPENDED"; displayName?: string }) {
  hashed ??= hashPassword(TEST_PASSWORD);
  const email = opts.email ?? `${opts.username}@example.com`;
  const doc = await UserModel.create({
    username: opts.username,
    usernameNormalized: opts.username.toLowerCase(),
    email,
    emailNormalized: email.toLowerCase(),
    passwordHash: await hashed,
    role: opts.role ?? "STUDENT",
    status: opts.status ?? "ACTIVE",
    displayName: opts.displayName ?? opts.username,
  });
  return doc;
}

export function actorOf(doc: { _id: unknown; role: Role; displayName: string }): Actor {
  return { id: String(doc._id), role: doc.role, displayName: doc.displayName, mustChangePassword: false };
}
