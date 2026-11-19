import "server-only";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { getAppUrl, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { isMailConfigured, sendMail } from "@/lib/mail/mailer";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { writeAudit } from "@/modules/audit/service";
import { UserModel } from "@/modules/users/model";
import type { Actor } from "@/modules/users/permissions";
import type { Role } from "@/modules/users/roles";
import { hashPassword, verifyDummy, verifyPassword } from "./password";
import { consumeToken, issueToken } from "./tokens";
import {
  changePasswordSchema,
  checkPasswordStrength,
  classifyIdentifier,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  type RegisterInput,
} from "./validation";

/** Error codes surfaced to the login form via NextAuth `error`. */
export const LOGIN_ERROR = {
  SUSPENDED: "ACCOUNT_SUSPENDED",
  NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type AuthFlags = {
  registrationOpen: boolean;
  passwordResetAvailable: boolean;
  requireEmailVerification: boolean;
  devWarning: boolean;
};

/**
 * Registration/password-reset availability (spec §3.2):
 * - requireEmailVerification && no mail provider → registration closed with a clear message.
 * - no mail provider → email password reset unavailable (admin can issue a temporary password).
 */
export function getAuthFlags(): AuthFlags {
  const env = getEnv();
  const mail = isMailConfigured();
  return {
    registrationOpen: !(env.requireEmailVerification && !mail),
    passwordResetAvailable: mail,
    requireEmailVerification: env.requireEmailVerification,
    devWarning: !env.isProduction && !env.requireEmailVerification,
  };
}

export type AuthenticatedUser = { id: string; role: Role; displayName: string; sessionVersion: number };

export async function registerStudent(raw: RegisterInput, ip: string): Promise<{ requiresEmailVerification: boolean }> {
  const input = registerSchema.parse(raw);
  const flags = getAuthFlags();
  if (!flags.registrationOpen) {
    throw errors.configMissing("Đăng ký tạm thời đóng vì hệ thống chưa cấu hình gửi email xác minh. Vui lòng liên hệ quản trị viên.");
  }
  await enforceRateLimit(RATE_LIMITS.registerByIp, ip);
  await connectToDatabase();

  const [usernameTaken, emailTaken] = await Promise.all([
    UserModel.exists({ usernameNormalized: input.username }),
    UserModel.exists({ emailNormalized: input.email }),
  ]);
  if (usernameTaken) {
    throw errors.conflict("Tên đăng nhập đã được sử dụng.", { fieldErrors: { username: ["Tên đăng nhập đã được sử dụng"] } });
  }
  if (emailTaken) {
    // With email verification on, respond identically to avoid revealing which emails exist.
    if (flags.requireEmailVerification) return { requiresEmailVerification: true };
    throw errors.conflict("Email đã được sử dụng.", { fieldErrors: { email: ["Email đã được sử dụng"] } });
  }

  let userId: string;
  try {
    const doc = await UserModel.create({
      username: input.username,
      usernameNormalized: input.username,
      email: input.email,
      emailNormalized: input.email,
      passwordHash: await hashPassword(input.password),
      role: "STUDENT",
      status: "ACTIVE",
      displayName: input.username,
    });
    userId = String(doc._id);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      // Lost a concurrent race on the unique index.
      throw errors.conflict("Tên đăng nhập hoặc email đã được sử dụng.");
    }
    throw err;
  }
  await writeAudit({ actorId: userId, action: "USER_REGISTERED", entityType: "User", entityId: userId });

  if (flags.requireEmailVerification) {
    await sendVerificationEmail(userId, input.email);
    return { requiresEmailVerification: true };
  }
  return { requiresEmailVerification: false };
}

async function sendVerificationEmail(userId: string, email: string) {
  const token = await issueToken(userId, "VERIFY_EMAIL");
  const link = `${getAppUrl()}/xac-minh-email?token=${token}`;
  try {
    await sendMail({
      to: email,
      subject: "Xác minh email — ExamHub THPT",
      text: `Chào bạn,\n\nNhấn vào liên kết sau để xác minh email (hiệu lực 24 giờ):\n${link}\n\nNếu bạn không đăng ký, hãy bỏ qua email này.`,
    });
  } catch {
    logger.error("auth.verify_email_send_failed", { userId });
  }
}

/**
 * Credentials check used by the NextAuth `authorize` callback.
 * Returns null for wrong credentials (generic message); throws coded errors only after the
 * password has been verified, so account existence is never revealed.
 */
export async function authenticate(identifier: string, password: string, ip: string): Promise<AuthenticatedUser | null> {
  const id = classifyIdentifier(identifier);
  if (!id.value || !password || password.length > 128) return null;
  try {
    await enforceRateLimit(RATE_LIMITS.loginByIp, ip);
    await enforceRateLimit(RATE_LIMITS.loginByIdentifier, `${id.kind}:${id.value}`);
  } catch (err) {
    if ((err as { code?: string }).code === "RATE_LIMITED") throw new Error(LOGIN_ERROR.RATE_LIMITED);
    throw err;
  }
  await connectToDatabase();
  const filter = id.kind === "email" ? { emailNormalized: id.value } : { usernameNormalized: id.value };
  const user = await UserModel.findOne(filter, { passwordHash: 1, role: 1, status: 1, displayName: 1, sessionVersion: 1, emailVerifiedAt: 1 })
    .select("+passwordHash")
    .lean();
  if (!user) {
    await verifyDummy(password);
    return null;
  }
  if (!(await verifyPassword(user.passwordHash, password))) return null;
  if (user.status !== "ACTIVE") throw new Error(LOGIN_ERROR.SUSPENDED);
  if (user.role === "STUDENT" && getEnv().requireEmailVerification && !user.emailVerifiedAt) {
    throw new Error(LOGIN_ERROR.NOT_VERIFIED);
  }
  await UserModel.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { id: String(user._id), role: user.role, displayName: user.displayName, sessionVersion: user.sessionVersion };
}

/** Requires the current password; bumps sessionVersion (revokes all other sessions). */
export async function changePassword(actor: Actor, raw: unknown): Promise<void> {
  const input = changePasswordSchema.parse(raw);
  await enforceRateLimit(RATE_LIMITS.changePasswordByUser, actor.id);
  await connectToDatabase();
  const user = await UserModel.findById(actor.id, { passwordHash: 1, username: 1, email: 1 }).select("+passwordHash").lean();
  if (!user) throw errors.unauthorized();
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw errors.validation({ fieldErrors: { currentPassword: ["Mật khẩu hiện tại không đúng"] } }, "Mật khẩu hiện tại không đúng.");
  }
  const weak = checkPasswordStrength(input.newPassword, { username: user.username, email: user.email });
  if (weak) throw errors.validation({ fieldErrors: { newPassword: [weak] } }, weak);
  await UserModel.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await hashPassword(input.newPassword), mustChangePassword: false }, $inc: { sessionVersion: 1 } },
  );
  await writeAudit({ actorId: actor.id, action: "PASSWORD_CHANGED", entityType: "User", entityId: actor.id });
}

/** Always resolves the same way whether or not the email exists (no enumeration). */
export async function requestPasswordReset(raw: unknown, ip: string): Promise<void> {
  const { email } = forgotPasswordSchema.parse(raw);
  if (!isMailConfigured()) {
    throw errors.configMissing("Chức năng khôi phục mật khẩu qua email chưa được cấu hình. Vui lòng liên hệ quản trị viên để được cấp mật khẩu tạm.");
  }
  await enforceRateLimit(RATE_LIMITS.passwordResetByIp, ip);
  await enforceRateLimit(RATE_LIMITS.passwordResetByEmail, email);
  await connectToDatabase();
  const user = await UserModel.findOne({ emailNormalized: email, status: "ACTIVE" }, { _id: 1, email: 1 }).lean();
  if (!user) return;
  const token = await issueToken(user._id, "RESET_PASSWORD");
  const link = `${getAppUrl()}/dat-lai-mat-khau?token=${token}`;
  try {
    await sendMail({
      to: user.email,
      subject: "Đặt lại mật khẩu — ExamHub THPT",
      text: `Chào bạn,\n\nNhấn vào liên kết sau để đặt lại mật khẩu (hiệu lực 30 phút, dùng một lần):\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    });
  } catch {
    logger.error("auth.reset_email_send_failed", { userId: String(user._id) });
  }
}

export async function resetPassword(raw: unknown, ip: string): Promise<void> {
  const input = resetPasswordSchema.parse(raw);
  await enforceRateLimit(RATE_LIMITS.passwordResetByIp, ip);
  await connectToDatabase();
  const userId = await consumeToken(input.token, "RESET_PASSWORD");
  if (!userId) throw errors.unprocessable("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
  await UserModel.updateOne(
    { _id: userId },
    { $set: { passwordHash: await hashPassword(input.newPassword), mustChangePassword: false }, $inc: { sessionVersion: 1 } },
  );
  await writeAudit({ actorId: userId, action: "PASSWORD_RESET", entityType: "User", entityId: userId });
}

export async function verifyEmail(token: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) throw errors.unprocessable("Liên kết xác minh không hợp lệ hoặc đã hết hạn.");
  await connectToDatabase();
  const userId = await consumeToken(token, "VERIFY_EMAIL");
  if (!userId) throw errors.unprocessable("Liên kết xác minh không hợp lệ hoặc đã hết hạn.");
  await UserModel.updateOne({ _id: userId, emailVerifiedAt: null }, { $set: { emailVerifiedAt: new Date() } });
  await writeAudit({ actorId: userId, action: "EMAIL_VERIFIED", entityType: "User", entityId: userId });
}
