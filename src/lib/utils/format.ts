export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";
export const MAX_SCORE_SCALED = 10_000;

/**
 * Scores are stored as integers 0..10000 (= 0..10.0000). Display with 2 decimals using
 * integer math (half-up) so 8.125 → "8.13" deterministically. Never sort by this string.
 */
export function formatScoreScaled(scaled: number): string {
  if (!Number.isFinite(scaled)) return "—";
  const clamped = Math.min(Math.max(Math.trunc(scaled), 0), MAX_SCORE_SCALED);
  const hundredths = Math.floor((clamped + 5) / 10); // 10000 scaled units → 1000 hundredths
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDateTimeVN(input: Date | string | number | null | undefined): string {
  if (input === null || input === undefined) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFormatter.format(d);
}

export function formatDateVN(input: Date | string | number | null | undefined): string {
  if (input === null || input === undefined) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
}

/** "mm:ss" or "h:mm:ss" for countdowns. Negative → 00:00. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "Không giới hạn";
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}
