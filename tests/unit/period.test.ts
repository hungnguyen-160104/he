import { describe, expect, it } from "vitest";
import { isWithin, periodBounds, periodLabel } from "@/lib/utils/period";

describe("periodBounds (Asia/Ho_Chi_Minh, UTC+7, week starts Monday)", () => {
  it("week: Sunday 23:30 VN belongs to the week starting the previous Monday", () => {
    // 2026-11-22 is a Sunday. 23:30 VN = 16:30Z
    const { start, end } = periodBounds("WEEK", new Date("2026-11-22T16:30:00Z"));
    expect(start.toISOString()).toBe("2026-11-15T17:00:00.000Z"); // Mon 16/11 00:00 VN
    expect(end.toISOString()).toBe("2026-11-22T17:00:00.000Z"); // Mon 23/11 00:00 VN
  });
  it("week: Monday 00:30 VN (Sunday 17:30Z) starts a new week even though UTC is still Sunday", () => {
    const { start } = periodBounds("WEEK", new Date("2026-11-22T17:30:00Z"));
    expect(start.toISOString()).toBe("2026-11-22T17:00:00.000Z");
  });
  it("month boundary crosses UTC day", () => {
    // 2026-11-30T18:00Z = 01/12 01:00 VN → December
    const { start, end } = periodBounds("MONTH", new Date("2026-11-30T18:00:00Z"));
    expect(start.toISOString()).toBe("2026-11-30T17:00:00.000Z");
    expect(end.toISOString()).toBe("2026-12-31T17:00:00.000Z");
  });
  it("year boundary: 31/12 23:59 UTC is already next year in Vietnam", () => {
    const { start, end } = periodBounds("YEAR", new Date("2026-12-31T23:59:00Z"));
    expect(start.toISOString()).toBe("2026-12-31T17:00:00.000Z"); // 01/01/2027 00:00 VN
    expect(end.toISOString()).toBe("2027-12-31T17:00:00.000Z");
  });
  it("start inclusive, end exclusive", () => {
    const { start, end } = periodBounds("WEEK", new Date("2026-11-18T05:00:00Z"));
    expect(isWithin(start, start, end)).toBe(true);
    expect(isWithin(end, start, end)).toBe(false);
    expect(isWithin(new Date(end.getTime() - 1), start, end)).toBe(true);
  });
  it("labels in Vietnamese", () => {
    const { start, end } = periodBounds("WEEK", new Date("2026-11-18T05:00:00Z"));
    expect(periodLabel("WEEK", start, end)).toBe("Tuần 16/11/2026 – 22/11/2026");
    const m = periodBounds("MONTH", new Date("2026-11-18T05:00:00Z"));
    expect(periodLabel("MONTH", m.start, m.end)).toBe("Tháng 11/2026");
  });
});
