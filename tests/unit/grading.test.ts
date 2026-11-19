import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { gradeExam, gradeShortAnswer, gradeSingleChoice, gradeTrueFalse, toScaled, MAX_SCALED, type GradableItem } from "@/modules/grading/engine";
import { DEMO_TYPE_RULES as R, typeRulesSchema } from "@/modules/grading/rule";

const tfKey = { values: { a: true, b: false, c: true, d: false } } as const;

describe("SINGLE_CHOICE", () => {
  it("correct / wrong / unanswered", () => {
    expect(gradeSingleChoice({ optionId: "B" }, { correctOptionId: "B" }, R)).toMatchObject({ correct: true, answered: true });
    expect(gradeSingleChoice({ optionId: "B" }, { correctOptionId: "B" }, R).awarded.toString()).toBe("0.25");
    expect(gradeSingleChoice({ optionId: "A" }, { correctOptionId: "B" }, R).awarded.toString()).toBe("0");
    expect(gradeSingleChoice(null, { correctOptionId: "B" }, R)).toMatchObject({ correct: null, answered: false });
    expect(gradeSingleChoice({ optionId: null }, { correctOptionId: "B" }, R).answered).toBe(false);
  });
});

describe("TRUE_FALSE", () => {
  it.each([
    [{ a: false, b: true, c: false, d: true }, 0, "0"],
    [{ a: true, b: true, c: false, d: true }, 1, "0.1"],
    [{ a: true, b: false, c: false, d: true }, 2, "0.25"],
    [{ a: true, b: false, c: true, d: true }, 3, "0.5"],
    [{ a: true, b: false, c: true, d: false }, 4, "1"],
  ])("%o → %i correct → %s points", (values, count, pts) => {
    const g = gradeTrueFalse({ values }, tfKey, R);
    expect(g.correctCount).toBe(count);
    expect(g.awarded.toString()).toBe(pts);
  });
  it("unanswered statements are not counted as correct and not coerced to false", () => {
    const g = gradeTrueFalse({ values: { a: true, b: null } }, tfKey, R);
    expect(g.correctCount).toBe(1);
    expect(g.statementResults).toEqual({ a: true, b: null, c: null, d: null });
    // b is false in the key; leaving it blank must NOT count as "false = correct"
    expect(gradeTrueFalse({ values: {} }, tfKey, R)).toMatchObject({ correctCount: 0, answered: false, correct: null });
  });
});

describe("SHORT_ANSWER", () => {
  const key = { answerType: "NUMBER" as const, acceptedAnswers: ["1,5"] };
  it("1,5 / 1.5 accepted, 15 rejected, blank = unanswered", () => {
    expect(gradeShortAnswer({ text: "1.5" }, key, R).awarded.toString()).toBe("0.5");
    expect(gradeShortAnswer({ text: " 1,5 " }, key, R).correct).toBe(true);
    expect(gradeShortAnswer({ text: "15" }, key, R).correct).toBe(false);
    expect(gradeShortAnswer({ text: "  " }, key, R).answered).toBe(false);
  });
});

describe("gradeExam & scaling", () => {
  const items: GradableItem[] = [
    { itemId: "1", type: "SINGLE_CHOICE", key: { correctOptionId: "A" }, response: { optionId: "A" } },
    { itemId: "2", type: "TRUE_FALSE", key: tfKey, response: { values: { a: true, b: false, c: true } } },
    { itemId: "3", type: "SHORT_ANSWER", key: { answerType: "NUMBER", acceptedAnswers: ["-2"] }, response: { text: "-2" } },
  ];
  it("sums exactly with Decimal and scales to 10", () => {
    const g = gradeExam(items, R);
    // 0.25 + 0.5 + 0.5 = 1.25 of 0.25 + 1 + 0.5 = 1.75 → 7.142857… → 7143 scaled
    expect(g.awardedRaw).toBe("1.25");
    expect(g.maxRaw).toBe("1.75");
    expect(g.scoreScaled).toBe(7143);
    expect(g.answeredCount).toBe(3);
  });
  it("all correct = exactly 10.000, none answered = 0", () => {
    const perfect = items.map((i) =>
      i.type === "TRUE_FALSE" ? { ...i, response: { values: tfKey.values } } : i,
    );
    expect(gradeExam(perfect, R).scoreScaled).toBe(MAX_SCALED);
    expect(gradeExam(items.map((i) => ({ ...i, response: null })), R).scoreScaled).toBe(0);
  });
  it("rounding is half-up, deterministic and bounded", () => {
    expect(toScaled(new Decimal(1), new Decimal(8))).toBe(1250);
    expect(toScaled(new Decimal("0.00005"), new Decimal(1))).toBe(1); // 0.5 → 1 (half-up)
    expect(toScaled(new Decimal(2), new Decimal(1))).toBe(MAX_SCALED);
    expect(() => toScaled(new Decimal(1), new Decimal(0))).toThrow("INVALID_MAX_POINTS");
    // classic float trap: 0.1 + 0.2 handled exactly
    expect(toScaled(new Decimal("0.1").plus("0.2"), new Decimal("0.3"))).toBe(MAX_SCALED);
  });
  it("rejects empty exams", () => {
    expect(() => gradeExam([], R)).toThrow("EMPTY_EXAM");
  });
});

describe("scoring rule validation", () => {
  it("TRUE_FALSE mapping must be non-decreasing with positive max", () => {
    expect(typeRulesSchema.safeParse(R).success).toBe(true);
    expect(typeRulesSchema.safeParse({ ...R, TRUE_FALSE: { pointsByCorrectCount: ["0", "0.5", "0.25", "0.5", "1"] } }).success).toBe(false);
    expect(typeRulesSchema.safeParse({ ...R, TRUE_FALSE: { pointsByCorrectCount: ["0", "0", "0", "0", "0"] } }).success).toBe(false);
    expect(typeRulesSchema.safeParse({ ...R, SINGLE_CHOICE: { points: "-1" } }).success).toBe(false);
  });
});
