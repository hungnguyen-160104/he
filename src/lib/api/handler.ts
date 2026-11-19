import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, errors, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { assertSameOrigin, requireJson } from "@/lib/security/origin";
import { assertNoMongoOperators } from "@/lib/validation/common";
import { getAppUrl } from "@/lib/env";

export type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, unknown> };
export type ApiFailure = { success: false; error: { code: string; message: string; details?: unknown }; requestId?: string };

const NO_STORE = "private, no-store, max-age=0";

export function jsonOk<T>(data: T, init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit; cache?: string }) {
  const body: ApiSuccess<T> = { success: true, data, ...(init?.meta ? { meta: init.meta } : {}) };
  const res = NextResponse.json(body, { status: init?.status ?? 200, headers: init?.headers });
  res.headers.set("Cache-Control", init?.cache ?? NO_STORE);
  return res;
}

export function jsonError(error: AppError, requestId?: string) {
  const body: ApiFailure = {
    success: false,
    error: { code: error.code, message: error.message, ...(error.details !== undefined ? { details: error.details } : {}) },
    ...(requestId ? { requestId } : {}),
  };
  const res = NextResponse.json(body, { status: error.status });
  res.headers.set("Cache-Control", NO_STORE);
  if (error.code === "RATE_LIMITED") {
    const retry = (error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds;
    if (retry) res.headers.set("Retry-After", String(retry));
  }
  if (requestId) res.headers.set("X-Request-Id", requestId);
  return res;
}

/** Map any thrown value to a safe AppError (never leaks stack traces / driver messages). */
export function toAppError(err: unknown): AppError {
  if (isAppError(err)) return err;
  if (err instanceof z.ZodError) return errors.validation(z.flattenError(err));
  if (err && typeof err === "object") {
    const e = err as { name?: string; code?: number };
    if (e.name === "CastError") return errors.badRequest("ID hoặc tham số không hợp lệ.");
    if (e.name === "ValidationError") return errors.validation(undefined);
    if (e.code === 11000) return errors.conflict("Dữ liệu đã tồn tại.");
    if (e.name === "VersionError") return errors.revisionConflict();
    if (e.name === "MongoServerSelectionError" || e.name === "MongoNetworkError") return errors.dbUnavailable();
  }
  return new AppError("INTERNAL_ERROR", "Đã có lỗi xảy ra. Vui lòng thử lại sau.", 500);
}

type RouteContext<P> = { params: Promise<P> };

type Handler<P> = (request: Request, ctx: { params: P; requestId: string }) => Promise<Response>;

/**
 * Wrap a Route Handler: request id, CSRF/origin check for mutations, error mapping, no-store.
 * Business logic must live in modules/<domain>/service — the handler only validates and delegates.
 */
export function apiHandler<P = Record<string, never>>(handler: Handler<P>, options?: { skipOriginCheck?: boolean }) {
  return async (request: Request, context: RouteContext<P>): Promise<Response> => {
    const requestId = crypto.randomUUID();
    try {
      if (!options?.skipOriginCheck) assertSameOrigin(request, [getAppUrl()]);
      const params = context?.params ? await context.params : ({} as P);
      const res = await handler(request, { params, requestId });
      res.headers.set("X-Request-Id", requestId);
      return res;
    } catch (err) {
      const appErr = toAppError(err);
      if (appErr.status >= 500) {
        logger.error("api.error", {
          requestId,
          method: request.method,
          path: new URL(request.url).pathname,
          code: appErr.code,
          errName: err instanceof Error ? err.name : typeof err,
          errMessage: appErr.code === "INTERNAL_ERROR" && err instanceof Error ? err.message : undefined,
        });
      }
      return jsonError(appErr, requestId);
    }
  };
}

const DEFAULT_MAX_BODY = 64 * 1024;

/** Read + size-limit + operator-check + Zod-validate a JSON body. */
export async function readJson<T extends z.ZodType>(request: Request, schema: T, maxBytes = DEFAULT_MAX_BODY): Promise<z.infer<T>> {
  requireJson(request);
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw errors.tooLarge();
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw errors.tooLarge();
  let raw: unknown;
  try {
    raw = text.length ? JSON.parse(text) : {};
  } catch {
    throw errors.badRequest("JSON không hợp lệ.");
  }
  assertNoMongoOperators(raw);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw errors.validation(z.flattenError(parsed.error));
  return parsed.data;
}
