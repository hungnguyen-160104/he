import Decimal from "decimal.js";
import { z } from "zod";
import { objectIdSchema } from "@/lib/validation/common";
import { QUESTION_TYPES, type QuestionType } from "@/modules/questions/types";

/**
 * Scoring rule configuration (versioned in `scoring_rules`, immutable once PUBLISHED).
 * Points are decimal STRINGS (exact). Exam score = awarded / max × 10 → integer scaled 0..10000.
 * Values are configuration, never hard-coded as "the" official rule for every year.
 */
const decimalString = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,4})?$/, "Điểm phải là số không âm, tối đa 4 chữ số thập phân (dùng dấu chấm)");

export const sectionSchema = z
  .object({
    id: z.string().trim().regex(/^[A-Za-z0-9_-]{1,10}$/),
    title: z.string().trim().min(1).max(80),
    questionType: z.enum(QUESTION_TYPES),
  })
  .strict();

export const typeRulesSchema = z
  .object({
    SINGLE_CHOICE: z.object({ points: decimalString }).strict(),
    TRUE_FALSE: z
      .object({
        pointsByCorrectCount: z.tuple([decimalString, decimalString, decimalString, decimalString, decimalString]),
      })
      .strict(),
    SHORT_ANSWER: z.object({ points: decimalString }).strict(),
  })
  .strict()
  .superRefine((r, ctx) => {
    const tf = r.TRUE_FALSE.pointsByCorrectCount.map((p) => new Decimal(p));
    for (let i = 1; i < tf.length; i++) {
      if (tf[i]!.lt(tf[i - 1]!)) ctx.addIssue({ code: "custom", path: ["TRUE_FALSE", "pointsByCorrectCount", i], message: "Điểm phải không giảm theo số ý đúng" });
    }
    if (tf[4]!.lte(0)) ctx.addIssue({ code: "custom", path: ["TRUE_FALSE", "pointsByCorrectCount", 4], message: "Điểm khi đúng cả 4 ý phải lớn hơn 0" });
  });
export type TypeRules = z.infer<typeof typeRulesSchema>;

export const scoringRuleInputSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    subjectId: objectIdSchema,
    examYear: z.number().int().min(2020).max(2100),
    sections: z.array(sectionSchema).min(1).max(6),
    typeRules: typeRulesSchema,
  })
  .strict()
  .superRefine((v, ctx) => {
    const ids = new Set<string>();
    v.sections.forEach((s, i) => {
      if (ids.has(s.id)) ctx.addIssue({ code: "custom", path: ["sections", i, "id"], message: "Mã phần bị trùng" });
      ids.add(s.id);
    });
  });
export type ScoringRuleInput = z.input<typeof scoringRuleInputSchema>;

/** Max raw points for one question of a type under a rule. */
export function maxPointsFor(type: QuestionType, rules: TypeRules): Decimal {
  if (type === "SINGLE_CHOICE") return new Decimal(rules.SINGLE_CHOICE.points);
  if (type === "SHORT_ANSWER") return new Decimal(rules.SHORT_ANSWER.points);
  return new Decimal(rules.TRUE_FALSE.pointsByCorrectCount[4]);
}

export function sectionForType(type: QuestionType, sections: { id: string; questionType: QuestionType }[]): string | null {
  return sections.find((s) => s.questionType === type)?.id ?? null;
}

/** DEMO rule modelled on the 2025 structure (I: MCQ, II: true/false, III: short answer). NOT an official regulation. */
export const DEMO_TYPE_RULES: TypeRules = {
  SINGLE_CHOICE: { points: "0.25" },
  TRUE_FALSE: { pointsByCorrectCount: ["0", "0.1", "0.25", "0.5", "1"] },
  SHORT_ANSWER: { points: "0.5" },
};
export const DEMO_SECTIONS = [
  { id: "I", title: "Phần I — Trắc nghiệm nhiều lựa chọn", questionType: "SINGLE_CHOICE" as const },
  { id: "II", title: "Phần II — Trắc nghiệm đúng/sai", questionType: "TRUE_FALSE" as const },
  { id: "III", title: "Phần III — Trả lời ngắn", questionType: "SHORT_ANSWER" as const },
];
