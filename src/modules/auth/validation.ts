import { z } from "zod";

/**
 * Account rules (documented in docs/SECURITY.md):
 * - username: 3–30 chars, lowercase ASCII letters/digits/`_`/`.`, must start and end with a
 *   letter or digit, no consecutive dots. Compared case-insensitively after normalization.
 * - email: trimmed + lowercased.
 * - password: 10–128 chars, not in the common-password list, not containing the username or
 *   email local part, at least 2 character classes. Error message stays generic.
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export function normalizeUsername(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

export function normalizeEmail(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_]|\.(?!\.))*[a-z0-9]$/;

export const usernameSchema = z
  .string({ error: "Vui lòng nhập tên đăng nhập" })
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(USERNAME_MIN, `Tên đăng nhập cần từ ${USERNAME_MIN} ký tự`)
      .max(USERNAME_MAX, `Tên đăng nhập tối đa ${USERNAME_MAX} ký tự`)
      .regex(USERNAME_RE, "Chỉ dùng chữ thường không dấu, số, dấu _ hoặc . (không bắt đầu/kết thúc bằng ký tự đặc biệt)"),
  );

export const emailSchema = z
  .string({ error: "Vui lòng nhập email" })
  .transform(normalizeEmail)
  .pipe(z.email("Email không hợp lệ").max(254, "Email quá dài"));

/** A compact list of very common passwords (lowercased). Not exhaustive by design. */
const COMMON_PASSWORDS = new Set([
  "1234567890", "12345678910", "0123456789", "123456789a", "a123456789", "1234567890a",
  "password", "password1", "password12", "password123", "password1234", "passw0rd123",
  "qwertyuiop", "qwerty123456", "qwerty12345", "1q2w3e4r5t", "1qaz2wsx3edc", "zaq12wsxcde",
  "abc1234567", "abcd123456", "abcdefghij", "iloveyou123", "iloveyou12", "admin12345",
  "administrator", "welcome123", "welcome1234", "letmein123", "football123", "monkey12345",
  "matkhau123", "matkhau1234", "matkhaumoi", "anhyeuem123", "emyeuanh123", "123456789@",
  "examhub123", "examhub1234", "thpt123456", "hocsinh123", "giaovien123", "vietnam123",
  "11111111111", "0000000000", "1111111111", "9876543210", "aaaaaaaaaa", "123123123123",
]);

function characterClasses(pw: string): number {
  let n = 0;
  if (/[a-z]/.test(pw)) n++;
  if (/[A-Z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}

export type PasswordContext = { username?: string; email?: string };

/** Returns null when acceptable, otherwise a generic Vietnamese message. */
export function checkPasswordStrength(password: string, ctx: PasswordContext = {}): string | null {
  if (password.length < PASSWORD_MIN) return `Mật khẩu cần tối thiểu ${PASSWORD_MIN} ký tự`;
  if (password.length > PASSWORD_MAX) return `Mật khẩu tối đa ${PASSWORD_MAX} ký tự`;
  const weak = "Mật khẩu quá yếu hoặc quá phổ biến. Hãy dùng cụm từ dài hơn, kết hợp chữ và số.";
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return weak;
  if (/^(.)\1+$/.test(password)) return weak;
  if (characterClasses(password) < 2) return weak;
  const username = ctx.username ? normalizeUsername(ctx.username) : "";
  const local = ctx.email ? normalizeEmail(ctx.email).split("@")[0] ?? "" : "";
  if (username.length >= 3 && lower.includes(username)) return "Mật khẩu không được chứa tên đăng nhập";
  if (local.length >= 3 && lower.includes(local)) return "Mật khẩu không được chứa phần đầu email";
  return null;
}

/**
 * Zod 4 skips object refinements when any field already failed. Cross-field checks (e.g.
 * password confirmation) should still show alongside field errors, so run them whenever the
 * input is an object and guard each field's type inside the refinement.
 */
const runOnObject = { when: (p: { value: unknown }) => typeof p.value === "object" && p.value !== null };
const str = (v: unknown): string => (typeof v === "string" ? v : "");

export const passwordSchema = z
  .string({ error: "Vui lòng nhập mật khẩu" })
  .min(PASSWORD_MIN, `Mật khẩu cần tối thiểu ${PASSWORD_MIN} ký tự`)
  .max(PASSWORD_MAX, `Mật khẩu tối đa ${PASSWORD_MAX} ký tự`);

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ error: "Vui lòng nhập lại mật khẩu" }),
    acceptTerms: z.literal(true, { error: "Bạn cần đồng ý điều khoản và chính sách quyền riêng tư" }),
  })
  .strict()
  .superRefine((v, ctx) => {
    const password = str(v.password);
    if (str(v.confirmPassword) && password !== str(v.confirmPassword)) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Mật khẩu nhập lại không khớp" });
    }
    if (password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX) {
      const weak = checkPasswordStrength(password, { username: str(v.username), email: str(v.email) });
      if (weak) ctx.addIssue({ code: "custom", path: ["password"], message: weak });
    }
  }, runOnObject);
export type RegisterInput = z.input<typeof registerSchema>;

/** Login identifier is either an email (contains "@") or a username. */
export const loginSchema = z
  .object({
    identifier: z.string({ error: "Vui lòng nhập tên đăng nhập hoặc email" }).trim().min(1, "Vui lòng nhập tên đăng nhập hoặc email").max(254),
    password: z.string({ error: "Vui lòng nhập mật khẩu" }).min(1, "Vui lòng nhập mật khẩu").max(PASSWORD_MAX),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export function classifyIdentifier(identifier: string): { kind: "email" | "username"; value: string } {
  const trimmed = identifier.trim();
  return trimmed.includes("@")
    ? { kind: "email", value: normalizeEmail(trimmed) }
    : { kind: "username", value: normalizeUsername(trimmed) };
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại").max(PASSWORD_MAX),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới"),
  })
  .strict()
  .superRefine((v, ctx) => {
    const next = str(v.newPassword);
    if (str(v.confirmPassword) && next !== str(v.confirmPassword)) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Mật khẩu nhập lại không khớp" });
    }
    if (next && next === str(v.currentPassword)) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
    }
    if (next.length >= PASSWORD_MIN && next.length <= PASSWORD_MAX) {
      const weak = checkPasswordStrength(next);
      if (weak) ctx.addIssue({ code: "custom", path: ["newPassword"], message: weak });
    }
  }, runOnObject);

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200).regex(/^[A-Za-z0-9_-]+$/),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới"),
  })
  .strict()
  .superRefine((v, ctx) => {
    const next = str(v.newPassword);
    if (str(v.confirmPassword) && next !== str(v.confirmPassword)) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Mật khẩu nhập lại không khớp" });
    }
    if (next.length >= PASSWORD_MIN && next.length <= PASSWORD_MAX) {
      const weak = checkPasswordStrength(next);
      if (weak) ctx.addIssue({ code: "custom", path: ["newPassword"], message: weak });
    }
  }, runOnObject);

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Biệt danh cần từ 2 ký tự")
  .max(40, "Biệt danh tối đa 40 ký tự")
  .regex(/^[\p{L}\p{N} _.-]+$/u, "Biệt danh chỉ gồm chữ, số, khoảng trắng và _ . -");
