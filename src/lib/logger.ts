/**
 * Minimal structured logger. Redacts sensitive keys so passwords, tokens, hashes, answer keys
 * and connection strings never reach logs. Keep log volume small (free tiers).
 */
const SENSITIVE_KEY = /pass(word)?|secret|token|hash|authorization|cookie|uri|answer|key|explanation|signature/i;

type LogMeta = Record<string, unknown>;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "string") {
    // Strip credentials in any URL-like string.
    return value.replace(/(mongodb(\+srv)?:\/\/)[^@\s]+@/gi, "$1[redacted]@").slice(0, 500);
  }
  return value;
}

function write(level: "info" | "warn" | "error", event: string, meta?: LogMeta) {
  if (process.env.NODE_ENV === "test" && level === "info") return;
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...(meta ? (redact(meta) as LogMeta) : {}) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, meta?: LogMeta) => write("info", event, meta),
  warn: (event: string, meta?: LogMeta) => write("warn", event, meta),
  error: (event: string, meta?: LogMeta) => write("error", event, meta),
};
