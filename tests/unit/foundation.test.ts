import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { getEnv, getMongoConfig, getConfigStatus, isUnlimitedMode, resetEnvCache, EnvValidationError } from "@/lib/env";
import { AppError, errors } from "@/lib/errors";
import { toAppError, readJson } from "@/lib/api/handler";
import { assertSameOrigin, safeRedirectPath } from "@/lib/security/origin";
import { assertNoMongoOperators, escapeRegex, paginationSchema, parseObjectId, parseSearchParams } from "@/lib/validation/common";
import { redact } from "@/lib/logger";
import { formatDuration, formatScoreScaled, formatDateTimeVN, formatMinutes } from "@/lib/utils/format";

const ORIGINAL_ENV = { ...process.env };
function setEnv(vars: Record<string, string | undefined>) {
  for (const k of Object.keys(process.env)) if (!(k in ORIGINAL_ENV)) delete process.env[k];
  Object.assign(process.env, ORIGINAL_ENV);
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetEnvCache();
}

afterEach(() => setEnv({}));

describe("env validation", () => {
  it("defaults when optional integrations are missing", () => {
    setEnv({ MONGODB_URI: undefined, CLOUDINARY_CLOUD_NAME: undefined, MAIL_PROVIDER: undefined });
    const env = getEnv();
    expect(env.MONGODB_DB_NAME).toBe("examhub");
    expect(env.MAIL_PROVIDER).toBe("none");
    expect(getConfigStatus()).toMatchObject({ database: false, cloudinary: false, mail: false });
  });

  it("missing MONGODB_URI raises controlled CONFIG_MISSING 503 (no crash)", () => {
    setEnv({ MONGODB_URI: undefined });
    try {
      getMongoConfig();
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).status).toBe(503);
      expect((e as AppError).code).toBe("CONFIG_MISSING");
    }
  });

  it("malformed values fail fast and never echo the value", () => {
    setEnv({ MONGODB_URI: "postgres://user:SuperSecret@host/db" });
    try {
      getEnv();
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(EnvValidationError);
      expect((e as Error).message).toContain("MONGODB_URI");
      expect((e as Error).message).not.toContain("SuperSecret");
    }
  });

  it("requires AUTH_SECRET in production and defaults email verification on", () => {
    setEnv({ NODE_ENV: "production", AUTH_SECRET: undefined, NEXTAUTH_SECRET: undefined });
    expect(() => getEnv()).toThrow(EnvValidationError);
    setEnv({ NODE_ENV: "production", AUTH_SECRET: "x".repeat(40) });
    expect(getEnv().requireEmailVerification).toBe(true);
  });

  it("UNLIMITED_MODE is ignored in production (limits stay on)", () => {
    setEnv({ NODE_ENV: "production", AUTH_SECRET: "x".repeat(40), UNLIMITED_MODE: "true" });
    expect(isUnlimitedMode()).toBe(false);
    setEnv({ NODE_ENV: "development", UNLIMITED_MODE: "true" });
    expect(isUnlimitedMode()).toBe(true);
  });

  it("rejects console mail provider in production", () => {
    setEnv({ NODE_ENV: "production", AUTH_SECRET: "x".repeat(40), MAIL_PROVIDER: "console" });
    expect(() => getEnv()).toThrow(/MAIL_PROVIDER/);
  });
});

describe("error mapping", () => {
  it("maps known errors to safe codes", () => {
    expect(toAppError(errors.forbidden()).status).toBe(403);
    expect(toAppError({ name: "CastError" }).status).toBe(400);
    expect(toAppError({ code: 11000 }).status).toBe(409);
    expect(toAppError({ name: "MongoServerSelectionError" }).status).toBe(503);
    const zodErr = z.object({ a: z.string() }).safeParse({ a: 1 }).error!;
    expect(toAppError(zodErr).status).toBe(422);
  });

  it("unknown errors become generic 500 without leaking message", () => {
    const e = toAppError(new Error("connection string mongodb://u:p@h leaked"));
    expect(e.status).toBe(500);
    expect(e.message).not.toContain("mongodb");
  });
});

describe("readJson", () => {
  const schema = z.object({ name: z.string().max(10) }).strict();
  const req = (body: string, headers: Record<string, string> = { "content-type": "application/json" }) =>
    new Request("http://localhost/api/x", { method: "POST", body, headers });

  it("parses valid JSON", async () => {
    await expect(readJson(req('{"name":"ok"}'), schema)).resolves.toEqual({ name: "ok" });
  });
  it("rejects non-JSON content type (form CSRF)", async () => {
    await expect(readJson(req("name=x", { "content-type": "application/x-www-form-urlencoded" }), schema)).rejects.toMatchObject({ status: 400 });
  });
  it("rejects oversized bodies", async () => {
    await expect(readJson(req(JSON.stringify({ name: "a".repeat(200) })), schema, 100)).rejects.toMatchObject({ status: 413 });
  });
  it("rejects Mongo operator keys", async () => {
    await expect(readJson(req('{"name":{"$ne":null}}'), schema)).rejects.toMatchObject({ status: 400 });
  });
  it("rejects unknown fields (mass assignment)", async () => {
    await expect(readJson(req('{"name":"a","role":"ADMIN"}'), schema)).rejects.toMatchObject({ status: 422 });
  });
});

describe("origin / CSRF", () => {
  const mk = (headers: Record<string, string>, method = "POST") => new Request("http://localhost:3000/api/x", { method, headers });
  it("allows same-origin and non-browser requests", () => {
    expect(() => assertSameOrigin(mk({ origin: "http://localhost:3000", host: "localhost:3000" }))).not.toThrow();
    expect(() => assertSameOrigin(mk({}))).not.toThrow();
    expect(() => assertSameOrigin(mk({ origin: "https://evil.example" }, "GET"))).not.toThrow();
  });
  it("blocks cross-origin mutations", () => {
    expect(() => assertSameOrigin(mk({ origin: "https://evil.example", host: "localhost:3000" }))).toThrow(AppError);
    expect(() => assertSameOrigin(mk({ "sec-fetch-site": "cross-site" }))).toThrow(AppError);
  });
  it("safeRedirectPath prevents open redirects", () => {
    expect(safeRedirectPath("/lich-su")).toBe("/lich-su");
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath(undefined, "/")).toBe("/");
  });
});

describe("validation helpers", () => {
  it("ObjectId parsing yields 404 for invalid ids", () => {
    expect(parseObjectId("507f1f77bcf86cd799439011")).toBe("507f1f77bcf86cd799439011");
    expect(() => parseObjectId("abc")).toThrow(AppError);
    expect(() => parseObjectId({ $gt: "" })).toThrow(AppError);
  });
  it("pagination defaults ≤20 and caps at 100", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(paginationSchema.safeParse({ limit: "500" }).success).toBe(false);
    expect(parseSearchParams(new URLSearchParams("page=2&limit=50"), paginationSchema)).toEqual({ page: 2, limit: 50 });
  });
  it("operator injection guard is recursive", () => {
    expect(() => assertNoMongoOperators({ a: [{ b: { "x.y": 1 } }] })).toThrow();
    expect(() => assertNoMongoOperators({ a: [{ b: "$notAKey" }] })).not.toThrow();
  });
  it("escapes regex metacharacters", () => {
    expect(escapeRegex("a.b*(c)")).toBe("a\\.b\\*\\(c\\)");
  });
});

describe("logger redaction", () => {
  it("redacts sensitive keys and credentials in strings", () => {
    const out = redact({ password: "p", nested: { tokenHash: "t", ok: 1 }, note: "mongodb+srv://u:pw@cluster/x" }) as Record<string, unknown>;
    expect(out.password).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).tokenHash).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).ok).toBe(1);
    expect(out.note).toBe("mongodb+srv://[redacted]@cluster/x");
  });
});

describe("formatting", () => {
  it("formats scaled scores with integer half-up rounding", () => {
    expect(formatScoreScaled(10000)).toBe("10.00");
    expect(formatScoreScaled(0)).toBe("0.00");
    expect(formatScoreScaled(8125)).toBe("8.13");
    expect(formatScoreScaled(8124)).toBe("8.12");
    expect(formatScoreScaled(12000)).toBe("10.00");
    expect(formatScoreScaled(-5)).toBe("0.00");
  });
  it("formats durations and minutes", () => {
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
    expect(formatDuration(-1)).toBe("00:00");
    expect(formatMinutes(90)).toBe("1 giờ 30 phút");
    expect(formatMinutes(null)).toBe("Không giới hạn");
  });
  it("formats dates in Asia/Ho_Chi_Minh", () => {
    // 2025-12-31T17:30Z = 2026-01-01 00:30 in Vietnam
    expect(formatDateTimeVN("2025-12-31T17:30:00Z")).toContain("01/01/2026");
  });
});
