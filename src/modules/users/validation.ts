import { z } from "zod";
import { displayNameSchema, emailSchema, usernameSchema } from "@/modules/auth/validation";
import { paginationSchema } from "@/lib/validation/common";
import { ROLES, USER_STATUSES } from "./roles";

export const GRADES = [10, 11, 12] as const;

export const updateProfileSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    grade: z.union([z.literal(10), z.literal(11), z.literal(12), z.null()]).optional(),
    leaderboardVisibility: z.enum(["PUBLIC", "HIDDEN"]).optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const createTeacherSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    displayName: displayNameSchema,
  })
  .strict();
export type CreateTeacherInput = z.input<typeof createTeacherSchema>;

export const updateUserStatusSchema = z.object({ status: z.enum(USER_STATUSES) }).strict();
export const updateUserRoleSchema = z.object({ role: z.enum(ROLES) }).strict();

export const listUsersQuerySchema = paginationSchema.extend({
  role: z.enum(ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  q: z.string().trim().max(60).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
