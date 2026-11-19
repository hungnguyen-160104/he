import { describe, expect, it } from "vitest";
import { computeStandings, type FirstAttemptRow } from "@/modules/rankings/service";

const E = ["e1", "e2", "e3"];
const t = (min: number) => new Date(Date.UTC(2026, 10, 16, 0, min));
const row = (userId: string, examId: string, scoreScaled: number, min = 0): FirstAttemptRow => ({ userId, examId, scoreScaled, finalizedAt: t(min), correctCount: 0 });

describe("computeStandings", () => {
  it("users completing 1/3 or 2/3 exams are not ranked but have progress", () => {
    const { ranked, progress } = computeStandings([row("a", "e1", 9000), row("b", "e1", 5000), row("b", "e2", 5000)], E);
    expect(ranked).toHaveLength(0);
    expect(progress.get("a")).toBe(1);
    expect(progress.get("b")).toBe(2);
  });

  it("3/3 → exact integer average with half-up rounding", () => {
    // (8000 + 7000 + 6001) / 3 = 7000.33 → 7000 ; (10000 + 0 + 5) / 3 = 3335 exactly ; (1+1+0)/3=0.67 → 1
    const { ranked } = computeStandings(
      [row("a", "e1", 8000), row("a", "e2", 7000), row("a", "e3", 6001), row("b", "e1", 10000), row("b", "e2", 0), row("b", "e3", 5), row("c", "e1", 1), row("c", "e2", 1), row("c", "e3", 0)],
      E,
    );
    expect(ranked.map((r) => [r.userId, r.scoreAverageScaled, r.rank])).toEqual([
      ["a", 7000, 1],
      ["b", 3335, 2],
      ["c", 1, 3],
    ]);
    // half-up: 2 exams averaging x.5
    const two = computeStandings([row("d", "e1", 1), row("d", "e2", 0)], ["e1", "e2"]);
    expect(two.ranked[0]!.scoreAverageScaled).toBe(1);
  });

  it("ties: earlier completion of the whole set wins, then userId (deterministic)", () => {
    const rows = [
      row("u2", "e1", 9000, 5), row("u2", "e2", 9000, 10), row("u2", "e3", 9000, 20),
      row("u1", "e1", 9000, 1), row("u1", "e2", 9000, 30), row("u1", "e3", 9000, 2),
      row("u3", "e1", 9000, 5), row("u3", "e2", 9000, 10), row("u3", "e3", 9000, 20),
    ];
    const order = computeStandings(rows, E).ranked.map((r) => r.userId);
    expect(order).toEqual(["u2", "u3", "u1"]);
    // stable regardless of input order
    expect(computeStandings([...rows].reverse(), E).ranked.map((r) => r.userId)).toEqual(order);
  });

  it("ignores exams outside the campaign and duplicate rows per exam (first wins)", () => {
    const { ranked } = computeStandings([row("a", "e1", 1000), row("a", "e1", 10000), row("a", "x", 10000), row("a", "e2", 1000), row("a", "e3", 1000)], E);
    expect(ranked[0]!.scoreAverageScaled).toBe(1000);
  });
});
