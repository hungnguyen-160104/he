/**
 * Domain/application error with an HTTP mapping. Messages are user-facing Vietnamese and must
 * never include secrets, stack traces, answer keys or internal identifiers beyond what is safe.
 */
export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "REVISION_CONFLICT"
  | "UNPROCESSABLE"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "CONFIG_MISSING"
  | "DB_UNAVAILABLE"
  | "ATTEMPT_EXPIRED"
  | "ATTEMPT_CLOSED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  badRequest: (message = "Yêu cầu không hợp lệ.", details?: unknown) => new AppError("BAD_REQUEST", message, 400, details),
  validation: (details?: unknown, message = "Dữ liệu không hợp lệ.") => new AppError("VALIDATION_ERROR", message, 422, details),
  unauthorized: (message = "Bạn cần đăng nhập để tiếp tục.") => new AppError("UNAUTHORIZED", message, 401),
  forbidden: (message = "Bạn không có quyền thực hiện thao tác này.") => new AppError("FORBIDDEN", message, 403),
  notFound: (message = "Không tìm thấy dữ liệu.") => new AppError("NOT_FOUND", message, 404),
  conflict: (message = "Dữ liệu bị xung đột.", details?: unknown) => new AppError("CONFLICT", message, 409, details),
  revisionConflict: (details?: unknown) =>
    new AppError("REVISION_CONFLICT", "Dữ liệu đã được thay đổi ở nơi khác (ví dụ tab khác). Vui lòng tải lại.", 409, details),
  unprocessable: (message: string, details?: unknown) => new AppError("UNPROCESSABLE", message, 422, details),
  tooLarge: (message = "Dữ liệu gửi lên quá lớn.") => new AppError("PAYLOAD_TOO_LARGE", message, 413),
  rateLimited: (retryAfterSeconds?: number) =>
    new AppError("RATE_LIMITED", "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.", 429, retryAfterSeconds ? { retryAfterSeconds } : undefined),
  configMissing: (message: string) => new AppError("CONFIG_MISSING", message, 503),
  dbUnavailable: () => new AppError("DB_UNAVAILABLE", "Không kết nối được cơ sở dữ liệu. Vui lòng thử lại sau.", 503),
};

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
