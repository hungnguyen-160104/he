import { describe, expect, it } from "vitest";
import { isShortAnswerCorrect, normalizeTextAnswer, parseNumberAnswer } from "@/modules/grading/short-answer";
import { questionBodySchema, shortAnswerKeySchema } from "@/modules/questions/validation";

describe("parseNumberAnswer", () => {
  it.each([
    ["1,5", "1.5"],
    ["1.5", "1.5"],
    [" -2 ", "-2"],
    ["+3", "3"],
    ["0,25", "0.25"],
    [",5", "0.5"],
    ["1 5", "15"],
    ["−2", "-2"],
  ])("parses %s → %s", (raw, expected) => {
    expect(parseNumberAnswer(raw)?.toString()).toBe(expected);
  });
  it.each(["", "abc", "1,000.5", "1.000,5", "1e5", "2+3", "1/2", "--1", "1,5,6"])("rejects %s", (raw) => {
    expect(parseNumberAnswer(raw)).toBeNull();
  });
});

describe("isShortAnswerCorrect", () => {
  const key = { answerType: "NUMBER" as const, acceptedAnswers: ["1,5"] };
  it("treats 1,5 and 1.5 as equal but never 15", () => {
    expect(isShortAnswerCorrect("1.5", key)).toBe(true);
    expect(isShortAnswerCorrect("1,50", key)).toBe(true);
    expect(isShortAnswerCorrect("15", key)).toBe(false);
  });
  it("empty / invalid answers are wrong", () => {
    expect(isShortAnswerCorrect("", key)).toBe(false);
    expect(isShortAnswerCorrect(null, key)).toBe(false);
    expect(isShortAnswerCorrect("một phẩy năm", key)).toBe(false);
  });
  it("applies tolerance only when configured (decimal-exact)", () => {
    expect(isShortAnswerCorrect("3.14", { answerType: "NUMBER", acceptedAnswers: ["3.1416"] })).toBe(false);
    expect(isShortAnswerCorrect("3.14", { answerType: "NUMBER", acceptedAnswers: ["3.1416"], tolerance: "0.01" })).toBe(true);
    expect(isShortAnswerCorrect("0.3", { answerType: "NUMBER", acceptedAnswers: ["0.1"], tolerance: "0.2" })).toBe(true); // no float drift
  });
  it("supports negative numbers and multiple accepted answers", () => {
    expect(isShortAnswerCorrect("-2", { answerType: "NUMBER", acceptedAnswers: ["2", "-2"] })).toBe(true);
  });
  it("text answers: trimmed, whitespace-collapsed, case-insensitive by default", () => {
    const t = { answerType: "TEXT" as const, acceptedAnswers: ["Hà Nội"] };
    expect(isShortAnswerCorrect("  hà   nội ", t)).toBe(true);
    expect(isShortAnswerCorrect("ha noi", t)).toBe(false);
    expect(isShortAnswerCorrect("hà nội", { ...t, caseSensitive: true })).toBe(false);
    expect(normalizeTextAnswer(" A  B ")).toBe("a b");
  });
});

describe("question schemas", () => {
  it("short answer key rejects invalid numeric accepted answers and misplaced tolerance", () => {
    expect(shortAnswerKeySchema.safeParse({ answerType: "NUMBER", acceptedAnswers: ["1.000,5"] }).success).toBe(false);
    expect(shortAnswerKeySchema.safeParse({ answerType: "TEXT", acceptedAnswers: ["x"], tolerance: "0.1" }).success).toBe(false);
    expect(shortAnswerKeySchema.safeParse({ answerType: "NUMBER", acceptedAnswers: ["1,5"], tolerance: "-1" }).success).toBe(false);
  });
  it("single choice requires exactly A–D and a correct option", () => {
    const base = { type: "SINGLE_CHOICE", content: { stem: "x", options: [{ id: "A", text: "1" }, { id: "B", text: "2" }, { id: "C", text: "3" }], media: [] }, key: { correctOptionId: "A" } };
    expect(questionBodySchema.safeParse(base).success).toBe(false);
  });
  it("true/false requires all 4 statement values", () => {
    const body = {
      type: "TRUE_FALSE",
      content: { stem: "x", statements: ["a", "b", "c", "d"].map((id) => ({ id, text: id })), media: [] },
      key: { values: { a: true, b: false, c: true } },
    };
    expect(questionBodySchema.safeParse(body).success).toBe(false);
  });
  it("media must be a Cloudinary URL (no arbitrary external images)", () => {
    const body = {
      type: "SHORT_ANSWER",
      content: { stem: "x", media: [{ publicId: "a/b", secureUrl: "https://evil.example/x.png", width: 1, height: 1, format: "png", bytes: 10, alt: "ảnh" }] },
      key: { answerType: "TEXT", acceptedAnswers: ["x"] },
    };
    expect(questionBodySchema.safeParse(body).success).toBe(false);
  });
});
