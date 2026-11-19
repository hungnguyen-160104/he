import type { Types } from "mongoose";
import type { Role, UserStatus } from "./roles";

/** Explicit allow-list projections. passwordHash / sessionVersion never leave the server. */
export const PROFILE_PROJECTION = {
  username: 1,
  email: 1,
  displayName: 1,
  role: 1,
  status: 1,
  grade: 1,
  leaderboardVisibility: 1,
  emailVerifiedAt: 1,
  mustChangePassword: 1,
  createdAt: 1,
  lastLoginAt: 1,
} as const;

type UserLean = {
  _id: Types.ObjectId;
  username: string;
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  grade?: number | null;
  leaderboardVisibility?: "PUBLIC" | "HIDDEN" | null;
  emailVerifiedAt?: Date | null;
  mustChangePassword?: boolean | null;
  createdAt?: Date;
  lastLoginAt?: Date | null;
};

export type ProfileDto = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: Role;
  grade: number | null;
  leaderboardVisibility: "PUBLIC" | "HIDDEN";
  emailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: string | null;
};

export function toProfileDto(u: UserLean): ProfileDto {
  return {
    id: String(u._id),
    username: u.username,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    grade: u.grade ?? null,
    leaderboardVisibility: u.leaderboardVisibility ?? "PUBLIC",
    emailVerified: Boolean(u.emailVerifiedAt),
    mustChangePassword: Boolean(u.mustChangePassword),
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
  };
}

export type AdminUserRowDto = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  createdAt: string | null;
  lastLoginAt: string | null;
};

export function toAdminUserRow(u: UserLean): AdminUserRowDto {
  return {
    id: String(u._id),
    username: u.username,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  };
}
