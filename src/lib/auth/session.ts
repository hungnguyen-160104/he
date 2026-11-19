import "server-only";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/env";
import { errors } from "@/lib/errors";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { isValidObjectId } from "@/lib/validation/common";
import { UserModel } from "@/modules/users/model";
import type { Actor } from "@/modules/users/permissions";
import type { Role } from "@/modules/users/roles";
import { getAuthOptions } from "./options";

/**
 * Resolve the current actor once per request: JWT → DB re-check (status ACTIVE, matching
 * sessionVersion). Role comes from the DB, never trusted from the token.
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  if (!isDatabaseConfigured()) return null;
  const session = await getServerSession(getAuthOptions());
  const uid = session?.user?.id;
  if (!uid || !isValidObjectId(uid)) return null;
  await connectToDatabase();
  const u = await UserModel.findById(uid, { role: 1, status: 1, displayName: 1, sessionVersion: 1, mustChangePassword: 1 }).lean();
  if (!u || u.status !== "ACTIVE" || u.sessionVersion !== session.user.sv) return null;
  return { id: String(u._id), role: u.role, displayName: u.displayName, mustChangePassword: Boolean(u.mustChangePassword) };
});

type RequireOptions = { allowMustChangePassword?: boolean };

/** Route Handlers: 401 if not signed in, 403 if role not allowed. */
export async function requireApiActor(roles?: readonly Role[], opts: RequireOptions = {}): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw errors.unauthorized();
  if (roles && !roles.includes(actor.role)) throw errors.forbidden();
  if (actor.mustChangePassword && !opts.allowMustChangePassword) {
    throw errors.forbidden("Bạn cần đổi mật khẩu tạm thời trước khi tiếp tục.");
  }
  return actor;
}

/** Pages/layouts: redirect instead of throwing. Pages that load data must call this too. */
export async function requirePageActor(roles?: readonly Role[], opts: RequireOptions = {}): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/dang-nhap");
  if (roles && !roles.includes(actor.role)) redirect("/khong-co-quyen");
  if (actor.mustChangePassword && !opts.allowMustChangePassword) redirect("/ho-so?doi-mat-khau=1");
  return actor;
}

/** Header chrome: never throws (DB down / not configured → guest view). */
export async function getHeaderUser(): Promise<{ displayName: string; role: Role } | null> {
  try {
    const actor = await getActor();
    return actor ? { displayName: actor.displayName, role: actor.role } : null;
  } catch {
    return null;
  }
}
