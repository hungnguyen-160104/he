import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearDb, setTestEnv, startTestDb, stopTestDb, syncAllIndexes } from "../helpers/db";
import { actorOf, createUser, TEST_PASSWORD } from "../helpers/factories";
import { UserModel } from "@/modules/users/model";
import { AuthTokenModel, consumeToken, issueToken } from "@/modules/auth/tokens";
import { RateLimitModel } from "@/lib/security/rate-limit";
import { AuditLogModel } from "@/modules/audit/service";
import { authenticate, changePassword, getAuthFlags, registerStudent, requestPasswordReset, resetPassword } from "@/modules/auth/service";
import {
  adminCreateTeacher,
  adminListUsers,
  adminResetUserPassword,
  adminSetUserRole,
  adminSetUserStatus,
  getProfile,
  updateProfile,
} from "@/modules/users/service";
import { AppError } from "@/lib/errors";

const IP = "203.0.113.7";
const reg = (username: string, email = `${username}@example.com`) => ({
  username,
  email,
  password: "On thi THPT 2026",
  confirmPassword: "On thi THPT 2026",
  acceptTerms: true as const,
});

async function expectAppError(p: Promise<unknown>, status: number) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === status);
}

beforeAll(async () => {
  await startTestDb();
  // Touch models so they are registered before index sync.
  void [UserModel, AuthTokenModel, RateLimitModel, AuditLogModel];
  await syncAllIndexes();
});
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  setTestEnv({ MAIL_PROVIDER: "none", REQUIRE_EMAIL_VERIFICATION: "false", NODE_ENV: "test" });
});

describe("registration", () => {
  it("creates a STUDENT and never stores plaintext password", async () => {
    await registerStudent(reg("hocsinh01"), IP);
    const u = await UserModel.findOne({ usernameNormalized: "hocsinh01" }).select("+passwordHash").lean();
    expect(u?.role).toBe("STUDENT");
    expect(u?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(u?.passwordHash).not.toContain("On thi THPT 2026");
    expect(await AuditLogModel.countDocuments({ action: "USER_REGISTERED" })).toBe(1);
  });

  it("rejects duplicate username case-insensitively and duplicate email", async () => {
    await registerStudent(reg("hocsinh01"), IP);
    await expectAppError(registerStudent(reg("HocSinh01", "other@example.com"), IP), 409);
    await expectAppError(registerStudent(reg("hocsinh02", "HOCSINH01@example.com"), IP), 409);
  });

  it("concurrent registrations of the same username create exactly one account", async () => {
    const results = await Promise.allSettled(Array.from({ length: 5 }, (_, i) => registerStudent(reg("trungten", `t${i}@example.com`), IP)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await UserModel.countDocuments({ usernameNormalized: "trungten" })).toBe(1);
  });

  it("is closed when email verification is required but no mail provider exists", async () => {
    setTestEnv({ REQUIRE_EMAIL_VERIFICATION: "true", MAIL_PROVIDER: "none" });
    expect(getAuthFlags().registrationOpen).toBe(false);
    await expectAppError(registerStudent(reg("hocsinh03"), IP), 503);
  });

  it("does not reveal existing email when verification is on", async () => {
    setTestEnv({ REQUIRE_EMAIL_VERIFICATION: "true", MAIL_PROVIDER: "console" });
    await createUser({ username: "cotruoc", email: "cotruoc@example.com" });
    await expect(registerStudent(reg("moi_dang_ky", "cotruoc@example.com"), IP)).resolves.toEqual({ requiresEmailVerification: true });
    expect(await UserModel.countDocuments({ emailNormalized: "cotruoc@example.com" })).toBe(1);
  });

  it("rate limits registration per IP", async () => {
    for (let i = 0; i < 10; i++) await registerStudent(reg(`rl_user${i}`), "198.51.100.1");
    await expectAppError(registerStudent(reg("rl_user_x"), "198.51.100.1"), 429);
  });
});

describe("login (authenticate)", () => {
  beforeEach(async () => {
    await createUser({ username: "minhanh", email: "MinhAnh@Example.com" });
  });

  it("accepts username or email, case-insensitively", async () => {
    expect(await authenticate("MinhAnh", TEST_PASSWORD, IP)).toMatchObject({ role: "STUDENT" });
    expect(await authenticate(" minhanh@example.COM ", TEST_PASSWORD, IP)).toMatchObject({ role: "STUDENT" });
  });

  it("returns null (generic) for wrong password and unknown user", async () => {
    expect(await authenticate("minhanh", "sai mat khau 123", IP)).toBeNull();
    expect(await authenticate("khongtontai", TEST_PASSWORD, IP)).toBeNull();
  });

  it("reveals suspension only after a correct password", async () => {
    await UserModel.updateOne({ usernameNormalized: "minhanh" }, { $set: { status: "SUSPENDED" } });
    expect(await authenticate("minhanh", "sai mat khau 123", IP)).toBeNull();
    await expect(authenticate("minhanh", TEST_PASSWORD, IP)).rejects.toThrow("ACCOUNT_SUSPENDED");
  });

  it("blocks unverified students when verification is required", async () => {
    setTestEnv({ REQUIRE_EMAIL_VERIFICATION: "true", MAIL_PROVIDER: "console" });
    await expect(authenticate("minhanh", TEST_PASSWORD, IP)).rejects.toThrow("EMAIL_NOT_VERIFIED");
  });

  it("rate limits brute force per identifier", async () => {
    for (let i = 0; i < 10; i++) await authenticate("minhanh", `wrong-pass-${i}x`, `10.0.0.${i}`);
    await expect(authenticate("minhanh", TEST_PASSWORD, "10.0.1.1")).rejects.toThrow("RATE_LIMITED");
  });
});

describe("RBAC and privilege escalation", () => {
  it("students and teachers cannot use admin operations (403)", async () => {
    const student = actorOf(await createUser({ username: "hs" }));
    const teacher = actorOf(await createUser({ username: "gv", role: "TEACHER" }));
    const input = { username: "gv_moi", email: "gvmoi@example.com", displayName: "GV mới" };
    await expectAppError(adminCreateTeacher(student, input), 403);
    await expectAppError(adminCreateTeacher(teacher, input), 403);
    await expectAppError(adminListUsers(student, { page: 1, limit: 20 }), 403);
    await expectAppError(adminSetUserRole(student, student.id, "ADMIN"), 403);
  });

  it("profile update cannot change role (strict schema)", async () => {
    const student = actorOf(await createUser({ username: "hs2" }));
    await expect(updateProfile(student, { role: "ADMIN" } as never)).rejects.toThrow();
    expect((await UserModel.findById(student.id).lean())?.role).toBe("STUDENT");
  });

  it("profile DTO never exposes password hash or session version", async () => {
    const student = actorOf(await createUser({ username: "hs3" }));
    const json = JSON.stringify(await getProfile(student));
    expect(json).not.toContain("argon2");
    expect(json).not.toContain("passwordHash");
    expect(json).not.toContain("sessionVersion");
  });
});

describe("admin user management", () => {
  it("admin creates a teacher who can log in with the temporary password and must change it", async () => {
    const admin = actorOf(await createUser({ username: "admin1", role: "ADMIN" }));
    const { user, temporaryPassword } = await adminCreateTeacher(admin, { username: "CoGiao_Lan", email: "lan@example.com", displayName: "Cô Lan" });
    expect(user.role).toBe("TEACHER");
    const auth = await authenticate("cogiao_lan", temporaryPassword, IP);
    expect(auth?.role).toBe("TEACHER");
    const doc = await UserModel.findById(user.id).lean();
    expect(doc?.mustChangePassword).toBe(true);
    expect(doc?.emailVerifiedAt).toBeNull();
    expect(await AuditLogModel.countDocuments({ action: "TEACHER_CREATED" })).toBe(1);
    await expectAppError(adminCreateTeacher(admin, { username: "cogiao_lan", email: "x@example.com", displayName: "Trùng" }), 409);
  });

  it("suspending revokes sessions; admin cannot lock self; last admin protected", async () => {
    const admin = actorOf(await createUser({ username: "admin1", role: "ADMIN" }));
    const student = await createUser({ username: "hs4" });
    await adminSetUserStatus(admin, String(student._id), "SUSPENDED");
    const after = await UserModel.findById(student._id).lean();
    expect(after?.status).toBe("SUSPENDED");
    expect(after?.sessionVersion).toBe(1);
    await expectAppError(adminSetUserStatus(admin, admin.id, "SUSPENDED"), 422);

    const admin2 = await createUser({ username: "admin2", role: "ADMIN" });
    // admin2 demotes admin1 → allowed (admin2 remains)
    await adminSetUserRole(actorOf(admin2), admin.id, "TEACHER");
    // Now admin2 is the last admin: an (ex-)admin cannot demote or lock them
    await createUser({ username: "admin3", role: "ADMIN", status: "SUSPENDED" });
    const a3 = actorOf({ _id: (await UserModel.findOne({ usernameNormalized: "admin3" }))!._id, role: "ADMIN", displayName: "a3" });
    await expectAppError(adminSetUserRole(a3, String(admin2._id), "STUDENT"), 422);
    expect((await UserModel.findById(admin2._id).lean())?.role).toBe("ADMIN");
  });

  it("invalid user id yields 404, not 500", async () => {
    const admin = actorOf(await createUser({ username: "admin1", role: "ADMIN" }));
    await expectAppError(adminSetUserStatus(admin, "not-an-id", "SUSPENDED"), 404);
    await expectAppError(adminSetUserStatus(admin, "507f1f77bcf86cd799439011", "SUSPENDED"), 404);
  });

  it("admin password reset issues a working temporary password and revokes sessions", async () => {
    const admin = actorOf(await createUser({ username: "admin1", role: "ADMIN" }));
    const student = await createUser({ username: "hs5" });
    const { temporaryPassword } = await adminResetUserPassword(admin, String(student._id));
    expect(await authenticate("hs5", TEST_PASSWORD, IP)).toBeNull();
    expect(await authenticate("hs5", temporaryPassword, IP)).not.toBeNull();
    expect((await UserModel.findById(student._id).lean())?.sessionVersion).toBe(1);
  });
});

describe("passwords and tokens", () => {
  it("change password requires the current password and bumps sessionVersion", async () => {
    const student = actorOf(await createUser({ username: "hs6" }));
    await expectAppError(changePassword(student, { currentPassword: "sai roi 12345", newPassword: "Mat khau moi 2027", confirmPassword: "Mat khau moi 2027" }), 422);
    await changePassword(student, { currentPassword: TEST_PASSWORD, newPassword: "Mat khau moi 2027", confirmPassword: "Mat khau moi 2027" });
    expect(await authenticate("hs6", "Mat khau moi 2027", IP)).not.toBeNull();
    expect((await UserModel.findById(student.id).lean())?.sessionVersion).toBe(1);
  });

  it("forgot password is unavailable without mail provider (no fake sending)", async () => {
    await expectAppError(requestPasswordReset({ email: "a@example.com" }, IP), 503);
  });

  it("forgot password responds identically for unknown emails", async () => {
    setTestEnv({ MAIL_PROVIDER: "console" });
    await expect(requestPasswordReset({ email: "khongco@example.com" }, IP)).resolves.toBeUndefined();
    expect(await AuthTokenModel.countDocuments()).toBe(0);
  });

  it("tokens are hashed, single-use and expire", async () => {
    const u = await createUser({ username: "hs7" });
    const token = await issueToken(u._id, "RESET_PASSWORD");
    const stored = await AuthTokenModel.findOne().lean();
    expect(stored?.tokenHash).not.toBe(token);
    await resetPassword({ token, newPassword: "Mat khau moi 2027", confirmPassword: "Mat khau moi 2027" }, IP);
    expect(await authenticate("hs7", "Mat khau moi 2027", IP)).not.toBeNull();
    await expectAppError(resetPassword({ token, newPassword: "Mat khau khac 2028", confirmPassword: "Mat khau khac 2028" }, IP), 422);

    const t2 = await issueToken(u._id, "RESET_PASSWORD");
    await AuthTokenModel.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await consumeToken(t2, "RESET_PASSWORD")).toBeNull();
  });

  it("issuing a new token invalidates the previous one", async () => {
    const u = await createUser({ username: "hs8" });
    const t1 = await issueToken(u._id, "VERIFY_EMAIL");
    const t2 = await issueToken(u._id, "VERIFY_EMAIL");
    expect(await consumeToken(t1, "VERIFY_EMAIL")).toBeNull();
    expect(String(await consumeToken(t2, "VERIFY_EMAIL"))).toBe(String(u._id));
  });
});
