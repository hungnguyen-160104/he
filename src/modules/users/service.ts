import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { escapeRegex, parseObjectId } from "@/lib/validation/common";
import { writeAudit } from "@/modules/audit/service";
import { generateTemporaryPassword, hashPassword } from "@/modules/auth/password";
import { UserModel } from "./model";
import { PROFILE_PROJECTION, toAdminUserRow, toProfileDto, type AdminUserRowDto, type ProfileDto } from "./dto";
import { assertRole, type Actor } from "./permissions";
import type { Role, UserStatus } from "./roles";
import {
  createTeacherSchema,
  updateProfileSchema,
  type CreateTeacherInput,
  type ListUsersQuery,
  type UpdateProfileInput,
} from "./validation";

export async function getProfile(actor: Actor): Promise<ProfileDto> {
  await connectToDatabase();
  const u = await UserModel.findById(actor.id, PROFILE_PROJECTION).lean();
  if (!u) throw errors.unauthorized();
  return toProfileDto(u);
}

export async function updateProfile(actor: Actor, raw: UpdateProfileInput): Promise<ProfileDto> {
  const input = updateProfileSchema.parse(raw);
  await connectToDatabase();
  const $set: Record<string, unknown> = {};
  if (input.displayName !== undefined) $set.displayName = input.displayName;
  if (input.grade !== undefined) $set.grade = input.grade;
  if (input.leaderboardVisibility !== undefined) $set.leaderboardVisibility = input.leaderboardVisibility;
  const u = await UserModel.findByIdAndUpdate(actor.id, { $set }, { returnDocument: "after", projection: PROFILE_PROJECTION, runValidators: true }).lean();
  if (!u) throw errors.unauthorized();
  return toProfileDto(u);
}

// ───────────────────────── Admin ─────────────────────────

export async function adminListUsers(actor: Actor, q: ListUsersQuery): Promise<{ items: AdminUserRowDto[]; total: number }> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (q.role) filter.role = q.role;
  if (q.status) filter.status = q.status;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q.toLowerCase()));
    filter.$or = [{ usernameNormalized: rx }, { emailNormalized: rx }, { displayName: new RegExp(escapeRegex(q.q), "i") }];
  }
  const [rows, total] = await Promise.all([
    UserModel.find(filter, PROFILE_PROJECTION).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    UserModel.countDocuments(filter),
  ]);
  return { items: rows.map(toAdminUserRow), total };
}

export async function adminCreateTeacher(
  actor: Actor,
  raw: CreateTeacherInput,
): Promise<{ user: AdminUserRowDto; temporaryPassword: string }> {
  assertRole(actor, ["ADMIN"]);
  const input = createTeacherSchema.parse(raw);
  await connectToDatabase();
  const temporaryPassword = generateTemporaryPassword();
  try {
    const doc = await UserModel.create({
      username: input.username,
      usernameNormalized: input.username,
      email: input.email,
      emailNormalized: input.email,
      passwordHash: await hashPassword(temporaryPassword),
      role: "TEACHER",
      status: "ACTIVE",
      displayName: input.displayName,
      mustChangePassword: true,
      createdBy: new Types.ObjectId(actor.id),
    });
    await writeAudit({ actorId: actor.id, action: "TEACHER_CREATED", entityType: "User", entityId: doc._id, metadata: { username: input.username } });
    return { user: toAdminUserRow(doc.toObject()), temporaryPassword };
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      const field = JSON.stringify((err as { keyPattern?: unknown }).keyPattern ?? "").includes("email") ? "email" : "username";
      throw errors.conflict(field === "email" ? "Email đã được sử dụng." : "Tên đăng nhập đã được sử dụng.", {
        fieldErrors: { [field]: [field === "email" ? "Email đã được sử dụng" : "Tên đăng nhập đã được sử dụng"] },
      });
    }
    throw err;
  }
}

async function countActiveAdmins(): Promise<number> {
  return UserModel.countDocuments({ role: "ADMIN", status: "ACTIVE" });
}

async function loadTarget(userId: string) {
  const id = parseObjectId(userId, "Không tìm thấy người dùng.");
  const target = await UserModel.findById(id, { role: 1, status: 1, username: 1 }).lean();
  if (!target) throw errors.notFound("Không tìm thấy người dùng.");
  return target;
}

/**
 * Lock/unlock. Suspending bumps sessionVersion so existing sessions are revoked immediately.
 * Guards: an admin cannot lock themselves; the last active admin can never be locked.
 */
export async function adminSetUserStatus(actor: Actor, userId: string, status: UserStatus): Promise<AdminUserRowDto> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const target = await loadTarget(userId);
  if (String(target._id) === actor.id) throw errors.unprocessable("Bạn không thể tự khóa tài khoản của mình.");
  if (target.status === status) {
    const same = await UserModel.findById(target._id, PROFILE_PROJECTION).lean();
    return toAdminUserRow(same!);
  }
  const update = status === "SUSPENDED" ? { $set: { status }, $inc: { sessionVersion: 1 } } : { $set: { status } };
  const updated = await UserModel.findByIdAndUpdate(target._id, update, { returnDocument: "after", projection: PROFILE_PROJECTION }).lean();
  if (target.role === "ADMIN" && status === "SUSPENDED" && (await countActiveAdmins()) === 0) {
    await UserModel.updateOne({ _id: target._id }, { $set: { status: "ACTIVE" } });
    throw errors.unprocessable("Không thể khóa quản trị viên cuối cùng.");
  }
  await writeAudit({ actorId: actor.id, action: "USER_STATUS_CHANGED", entityType: "User", entityId: target._id, metadata: { from: target.status, to: status } });
  return toAdminUserRow(updated!);
}

/** Role change (audited). Bumps sessionVersion so the new role applies on next request. */
export async function adminSetUserRole(actor: Actor, userId: string, role: Role): Promise<AdminUserRowDto> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const target = await loadTarget(userId);
  if (String(target._id) === actor.id) throw errors.unprocessable("Bạn không thể tự thay đổi vai trò của mình.");
  if (target.role === role) {
    const same = await UserModel.findById(target._id, PROFILE_PROJECTION).lean();
    return toAdminUserRow(same!);
  }
  const updated = await UserModel.findByIdAndUpdate(
    target._id,
    { $set: { role }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after", projection: PROFILE_PROJECTION },
  ).lean();
  if (target.role === "ADMIN" && (await countActiveAdmins()) === 0) {
    await UserModel.updateOne({ _id: target._id }, { $set: { role: "ADMIN" } });
    throw errors.unprocessable("Không thể hạ quyền quản trị viên cuối cùng.");
  }
  await writeAudit({ actorId: actor.id, action: "USER_ROLE_CHANGED", entityType: "User", entityId: target._id, metadata: { from: target.role, to: role } });
  return toAdminUserRow(updated!);
}

/** Admin-issued temporary password (for setups without email). Shown once; must be changed. */
export async function adminResetUserPassword(actor: Actor, userId: string): Promise<{ temporaryPassword: string }> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const target = await loadTarget(userId);
  if (String(target._id) === actor.id) throw errors.unprocessable("Hãy dùng chức năng đổi mật khẩu trong Hồ sơ.");
  const temporaryPassword = generateTemporaryPassword();
  await UserModel.updateOne(
    { _id: target._id },
    { $set: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true }, $inc: { sessionVersion: 1 } },
  );
  await writeAudit({ actorId: actor.id, action: "USER_PASSWORD_RESET_BY_ADMIN", entityType: "User", entityId: target._id });
  return { temporaryPassword };
}

export async function adminUserCounts(actor: Actor) {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const rows = await UserModel.aggregate<{ _id: { role: Role; status: UserStatus }; n: number }>([
    { $group: { _id: { role: "$role", status: "$status" }, n: { $sum: 1 } } },
  ]);
  const out = { STUDENT: 0, TEACHER: 0, ADMIN: 0, SUSPENDED: 0 };
  for (const r of rows) {
    out[r._id.role] += r.n;
    if (r._id.status === "SUSPENDED") out.SUSPENDED += r.n;
  }
  return out;
}
