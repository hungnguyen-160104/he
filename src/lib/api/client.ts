/**
 * Browser-side JSON client for our Route Handlers. Same-origin only; cookies are sent by default.
 * Returns a discriminated result instead of throwing so forms can map field errors.
 */
export type ApiErrorBody = { code: string; message: string; details?: unknown };
export type ApiResult<T> = { ok: true; data: T; meta?: Record<string, unknown> } | { ok: false; status: number; error: ApiErrorBody };

export async function apiFetch<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal; headers?: Record<string, string> }): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
      headers: { ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init?.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    return { ok: false, status: 0, error: { code: "NETWORK_ERROR", message: "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại." } };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON (e.g. proxy error page)
  }
  const body = json as { success?: boolean; data?: T; meta?: Record<string, unknown>; error?: ApiErrorBody } | null;
  if (res.ok && body?.success) return { ok: true, data: body.data as T, meta: body.meta };
  return {
    ok: false,
    status: res.status,
    error: body?.error ?? { code: "UNKNOWN", message: res.status >= 500 ? "Máy chủ đang gặp sự cố. Vui lòng thử lại sau." : "Yêu cầu không thành công." },
  };
}

/** Extract Zod flattened field errors from an API error body. */
export function fieldErrorsOf(error: ApiErrorBody): Record<string, string> {
  const details = error.details as { fieldErrors?: Record<string, string[] | undefined> } | undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(details?.fieldErrors ?? {})) if (v?.[0]) out[k] = v[0];
  return out;
}
