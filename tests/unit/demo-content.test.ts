import { describe, expect, it } from "vitest";
import { DEMO_EXAMS } from "../../scripts/demo-content/index";
import { EXPECTED_STRUCTURE } from "../../scripts/demo-content/structure";
import { topicSlug } from "../../scripts/demo-content/builders";
import { questionBodySchema } from "@/modules/questions/validation";
import { findLatexErrors } from "@/lib/rich-text/parse";
import { parseNumberAnswer } from "@/modules/grading/short-answer";
import { gradeExam, type GradableItem } from "@/modules/grading/engine";
import { typeRulesSchema } from "@/modules/grading/rule";

describe("THPT 2025-format DEMO exams", () => {
  it("one exam per subject, unique slugs", () => {
    expect(DEMO_EXAMS.map((e) => e.slug).sort()).toEqual(Object.keys(EXPECTED_STRUCTURE).sort());
  });

  for (const exam of DEMO_EXAMS) {
    describe(exam.subjectName, () => {
      it("matches the 3-part structure and duration", () => {
        const e = EXPECTED_STRUCTURE[exam.slug]!;
        const count = (p: string) => exam.questions.filter((q) => q.part === p).length;
        expect({ I: count("I"), II: count("II"), III: count("III"), minutes: exam.durationMinutes }).toEqual(e);
        expect(exam.questions.every((q) => (q.part === "I") === (q.body.type === "SINGLE_CHOICE"))).toBe(true);
        expect(exam.questions.every((q) => (q.part === "II") === (q.body.type === "TRUE_FALSE"))).toBe(true);
        expect(exam.questions.every((q) => q.topic >= 0 && q.topic < exam.topics.length)).toBe(true);
        for (const t of exam.topics) expect(topicSlug(t).length, t).toBeLessThanOrEqual(60); // Topic.slug maxlength
      });

      it("every question is valid, has a solution, and renders without LaTeX errors", () => {
        for (const q of exam.questions) {
          const parsed = questionBodySchema.safeParse(q.body);
          expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
          expect(q.body.explanation?.trim().length).toBeGreaterThan(10);
          const texts = [q.body.content.stem, q.body.explanation ?? ""];
          if (q.body.type === "SINGLE_CHOICE") texts.push(...q.body.content.options.map((o) => o.text));
          if (q.body.type === "TRUE_FALSE") texts.push(...q.body.content.statements.map((s) => s.text));
          for (const t of texts) expect(findLatexErrors(t), t).toEqual([]);
          if (q.body.type === "SINGLE_CHOICE") expect(new Set(q.body.content.options.map((o) => o.text)).size).toBe(4);
          if (q.body.type === "SHORT_ANSWER") {
            const a = q.body.key.acceptedAnswers[0]!;
            expect(a.length).toBeLessThanOrEqual(4); // answer sheet allows 4 characters
            expect(parseNumberAnswer(a)).not.toBeNull();
          }
        }
      });

      it("a perfect answer sheet scores exactly 10.00; correct letters are spread out", () => {
        const rules = typeRulesSchema.parse({
          SINGLE_CHOICE: { points: "0.25" },
          TRUE_FALSE: { pointsByCorrectCount: ["0", "0.1", "0.25", "0.5", "1"] },
          SHORT_ANSWER: { points: exam.shortAnswerPoints },
        });
        const items: GradableItem[] = exam.questions.map((q, i) => {
          const b = q.body;
          if (b.type === "SINGLE_CHOICE") return { itemId: String(i), type: b.type, key: b.key, response: { optionId: b.key.correctOptionId } };
          if (b.type === "TRUE_FALSE") return { itemId: String(i), type: b.type, key: b.key, response: { values: b.key.values } };
          return { itemId: String(i), type: b.type, key: b.key, response: { text: b.key.acceptedAnswers[0]! } };
        });
        const g = gradeExam(items, rules);
        expect(g.maxRaw).toBe("10");
        expect(g.scoreScaled).toBe(10_000);
        const letters = exam.questions.flatMap((q) => (q.body.type === "SINGLE_CHOICE" ? [q.body.key.correctOptionId] : []));
        for (const l of ["A", "B", "C", "D"]) expect(letters.filter((x) => x === l).length).toBeGreaterThanOrEqual(2);
        const tfValues = exam.questions.flatMap((q) => (q.body.type === "TRUE_FALSE" ? Object.values(q.body.key.values) : []));
        if (tfValues.length) {
          expect(tfValues.filter(Boolean).length).toBeGreaterThan(4);
          expect(tfValues.filter((v) => !v).length).toBeGreaterThan(4);
        }
      });
    });
  }
});
