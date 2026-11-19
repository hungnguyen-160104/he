import { z } from "zod";
import { errors } from "@/lib/errors";

/** 24-hex ObjectId. Invalid ids yield a controlled 400/404, never a CastError 500. */
export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "ID không hợp lệ");

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type Pagination = z.infer<typeof paginationSchema>;

export function paginationMeta(p: Pagination, total: number) {
  return { page: p.page, limit: p.limit, total, totalPages: Math.max(1, Math.ceil(total / p.limit)) };
}

export function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);
}

export function parseObjectId(id: unknown, message = "Không tìm thấy dữ liệu."): string {
  if (!isValidObjectId(id)) throw errors.notFound(message);
  return id;
}

/** Search text: trimmed, bounded and regex-escaped before use in queries. */
export const searchTextSchema = z.string().trim().max(100).optional();
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Reject any object key starting with `$` or containing `.` (Mongo operator / path injection),
 * recursively. Zod strict schemas already limit shape; this is defense-in-depth for free-form
 * JSON fields (e.g. answers payloads).
 */
export function assertNoMongoOperators(value: unknown, depth = 0): void {
  if (depth > 20) throw errors.badRequest("Dữ liệu lồng nhau quá sâu.");
  if (Array.isArray(value)) {
    for (const v of value) assertNoMongoOperators(v, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith("$") || k.includes(".")) throw errors.badRequest("Dữ liệu chứa khóa không hợp lệ.");
      assertNoMongoOperators(v, depth + 1);
    }
  }
}

/** Parse URLSearchParams into a plain object (first value wins) then validate. */
export function parseSearchParams<T extends z.ZodType>(params: URLSearchParams, schema: T): z.infer<T> {
  const obj: Record<string, string> = {};
  for (const [k, v] of params.entries()) if (!(k in obj)) obj[k] = v;
  const result = schema.safeParse(obj);
  if (!result.success) throw errors.validation(z.flattenError(result.error), "Tham số truy vấn không hợp lệ.");
  return result.data;
}
