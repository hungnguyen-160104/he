import { TZDate } from "@date-fns/tz";
import { addMonths, addWeeks, addYears, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { APP_TIMEZONE } from "./format";

export const PERIOD_TYPES = ["WEEK", "MONTH", "YEAR"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];
export const PERIOD_LABELS: Record<PeriodType, string> = { WEEK: "Tuần", MONTH: "Tháng", YEAR: "Năm" };

/**
 * Period bounds in Asia/Ho_Chi_Minh: [start, end) — start inclusive, end exclusive.
 * Weeks start on Monday. Returned as UTC instants (plain Date).
 */
export function periodBounds(periodType: PeriodType, reference: Date): { start: Date; end: Date } {
  const local = new TZDate(reference.getTime(), APP_TIMEZONE);
  let start: TZDate;
  let end: TZDate;
  if (periodType === "WEEK") {
    start = startOfWeek(local, { weekStartsOn: 1 });
    end = addWeeks(start, 1);
  } else if (periodType === "MONTH") {
    start = startOfMonth(local);
    end = addMonths(start, 1);
  } else {
    start = startOfYear(local);
    end = addYears(start, 1);
  }
  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}

export function isWithin(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime();
  return t >= start.getTime() && t < end.getTime();
}

/** Human label in Vietnamese, e.g. "Tuần 17/11/2026 – 23/11/2026". */
export function periodLabel(periodType: PeriodType, start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("vi-VN", { timeZone: APP_TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric" });
  const lastDay = new Date(end.getTime() - 1);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIMEZONE, month: "2-digit", year: "numeric" }).formatToParts(start);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  if (periodType === "MONTH") return `Tháng ${month}/${year}`;
  if (periodType === "YEAR") return `Năm ${year}`;
  return `Tuần ${fmt.format(start)} – ${fmt.format(lastDay)}`;
}
