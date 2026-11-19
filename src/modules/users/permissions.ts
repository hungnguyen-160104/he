import { errors } from "@/lib/errors";
import type { Role } from "./roles";

/** Authenticated principal as verified against the DB for this request. */
export type Actor = {
  id: string;
  role: Role;
  displayName: string;
  mustChangePassword: boolean;
};

export function assertRole(actor: Actor | null | undefined, roles: readonly Role[]): asserts actor is Actor {
  if (!actor) throw errors.unauthorized();
  if (!roles.includes(actor.role)) throw errors.forbidden();
}

export const isAdmin = (a: Actor) => a.role === "ADMIN";
export const isTeacherOrAdmin = (a: Actor) => a.role === "TEACHER" || a.role === "ADMIN";

/** Only STUDENT accounts take part in student leaderboards (spec §1.3). */
export const isRankEligibleRole = (role: Role) => role === "STUDENT";
