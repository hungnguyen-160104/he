import { describe, expect, it } from "vitest";
import {
  checkPasswordStrength,
  classifyIdentifier,
  emailSchema,
  loginSchema,
  normalizeEmail,
  normalizeUsername,
  registerSchema,
  usernameSchema,
} from "@/modules/auth/validation";

const valid = {
  username: "hoc_sinh.01",
  email: "HocSinh@Example.com ",
  password: "Bau troi xanh 2026",
  confirmPassword: "Bau troi xanh 2026",
  acceptTerms: true,
};

describe("username", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeUsername("  NguyenVan_A ")).toBe("nguyenvan_a");
    expect(usernameSchema.parse("User.Name")).toBe("user.name");
  });
  it.each(["ab", "a".repeat(31), "_abc", "abc.", "a..b", "nguyễn", "a b", "ab$c"])("rejects %s", (u) => {
    expect(usernameSchema.safeParse(u).success).toBe(false);
  });
  it.each(["abc", "user_1", "a.b.c", "x".repeat(30)])("accepts %s", (u) => {
    expect(usernameSchema.safeParse(u).success).toBe(true);
  });
});

describe("email", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  A@B.COM ")).toBe("a@b.com");
    expect(emailSchema.parse(" Test@Mail.VN ")).toBe("test@mail.vn");
  });
  it("rejects invalid", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("password strength", () => {
  it("rejects short, common, single-class and repeated passwords", () => {
    expect(checkPasswordStrength("short1")).not.toBeNull();
    expect(checkPasswordStrength("password123")).not.toBeNull();
    expect(checkPasswordStrength("1234567890")).not.toBeNull();
    expect(checkPasswordStrength("aaaaaaaaaaaa")).not.toBeNull();
    expect(checkPasswordStrength("onlylowercaseletters")).not.toBeNull();
  });
  it("rejects passwords containing username or email local part", () => {
    expect(checkPasswordStrength("hocsinh01-2026x", { username: "hocsinh01" })).not.toBeNull();
    expect(checkPasswordStrength("minhanh-2026x", { email: "minhanh@example.com" })).not.toBeNull();
  });
  it("accepts reasonable passphrases", () => {
    expect(checkPasswordStrength("Bau troi xanh 2026")).toBeNull();
    expect(checkPasswordStrength("ontap-thpt-9diem")).toBeNull();
  });
});

describe("register schema", () => {
  it("accepts valid input and normalizes", () => {
    const r = registerSchema.parse(valid);
    expect(r.email).toBe("hocsinh@example.com");
    expect(r.username).toBe("hoc_sinh.01");
  });
  it("requires matching confirmation", () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: "khac nhau 2026" });
    expect(r.success).toBe(false);
  });
  it("requires terms acceptance", () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
  it("rejects mass-assignment of role", () => {
    expect(registerSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(false);
  });
});

describe("login identifier", () => {
  it("classifies email vs username case-insensitively", () => {
    expect(classifyIdentifier(" Student@Mail.com ")).toEqual({ kind: "email", value: "student@mail.com" });
    expect(classifyIdentifier("Student_01")).toEqual({ kind: "username", value: "student_01" });
  });
  it("requires both fields", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "a", password: "" }).success).toBe(false);
  });
});

describe("cross-field errors appear together with field errors", () => {
  it("reports mismatch even when terms are not accepted", () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: "Khac nhau 2026", acceptTerms: false });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toContain("confirmPassword");
    expect(paths).toContain("acceptTerms");
  });
  it("reports weak password even when another field is invalid", () => {
    const r = registerSchema.safeParse({ ...valid, email: "bad", password: "password123", confirmPassword: "password123" });
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toContain("password");
    expect(paths).toContain("email");
  });
});
