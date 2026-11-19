/** Shared (client-safe) role definitions. */
export const ROLES = ["STUDENT", "TEACHER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Học sinh",
  TEACHER: "Giáo viên",
  ADMIN: "Quản trị viên",
};

export function homePathForRole(role: Role): string {
  if (role === "ADMIN") return "/quan-tri";
  if (role === "TEACHER") return "/giao-vien";
  return "/dashboard";
}

export function isStaff(role: Role): boolean {
  return role === "TEACHER" || role === "ADMIN";
}
