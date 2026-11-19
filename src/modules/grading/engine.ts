import Decimal from "decimal.js";
import type { OptionId, QuestionType, StatementId } from "@/modules/questions/types";
import { isShortAnswerCorrect, type ShortAnswerKey } from "./short-answer";
import { maxPointsFor, type TypeRules } from "./rule";

/**
 * Pure grading functions. The server grades ONLY from: attempt snapshot (item refs), private
 * question keys and the frozen scoring rule. Client-sent scores are never trusted.
 * Rounding happens at exactly one place: `toScaled` (half-up to integer 0..10000).
 */
export const MAX_SCALED = 10_000;

export type SingleChoiceResponse = { optionId: OptionId | null } | null | undefined;
export type TrueFalseResponse = { values: Partial<Record<StatementId, boolean | null>> } | null | undefined;
export type ShortAnswerResponse = { text: string } | null | undefined;
export type AnyResponse = SingleChoiceResponse | TrueFalseResponse | ShortAnswerResponse;

export type SingleChoiceKey = { correctOptionId: OptionId };
export type TrueFalseKey = { values: Record<StatementId, boolean> };

export type ItemGrade = {
  awarded: Decimal;
  max: Decimal;
  /** true/false for fully right/wrong; null when unanswered. */
  correct: boolean | null;
  answered: boolean;
  /** TRUE_FALSE: number of statements answered correctly (0..4). */
  correctCount?: number;
  /** TRUE_FALSE per-statement correctness (null = unanswered). */
  statementResults?: Record<StatementId, boolean | null>;
};

export function gradeSingleChoice(response: SingleChoiceResponse, key: SingleChoiceKey, rules: TypeRules): ItemGrade {
  const max = maxPointsFor("SINGLE_CHOICE", rules);
  const chosen = response?.optionId ?? null;
  if (!chosen) return { awarded: new Decimal(0), max, correct: null, answered: false };
  const ok = chosen === key.correctOptionId;
  return { awarded: ok ? max : new Decimal(0), max, correct: ok, answered: true };
}

const STATEMENTS: StatementId[] = ["a", "b", "c", "d"];

export function gradeTrueFalse(response: TrueFalseResponse, key: TrueFalseKey, rules: TypeRules): ItemGrade {
  const max = maxPointsFor("TRUE_FALSE", rules);
  const values = response?.values ?? {};
  let correctCount = 0;
  let answeredAny = false;
  const statementResults = {} as Record<StatementId, boolean | null>;
  for (const s of STATEMENTS) {
    const v = values[s];
    if (v === true || v === false) {
      answeredAny = true;
      const ok = v === key.values[s];
      statementResults[s] = ok;
      if (ok) correctCount++;
    } else {
      // Unanswered statements are never counted as correct (and never coerced to false).
      statementResults[s] = null;
    }
  }
  const awarded = new Decimal(rules.TRUE_FALSE.pointsByCorrectCount[correctCount]!);
  return {
    awarded,
    max,
    correct: answeredAny ? correctCount === 4 : null,
    answered: answeredAny,
    correctCount,
    statementResults,
  };
}

export function gradeShortAnswer(response: ShortAnswerResponse, key: ShortAnswerKey, rules: TypeRules): ItemGrade {
  const max = maxPointsFor("SHORT_ANSWER", rules);
  const text = response?.text ?? "";
  if (!text.trim()) return { awarded: new Decimal(0), max, correct: null, answered: false };
  const ok = isShortAnswerCorrect(text, key);
  return { awarded: ok ? max : new Decimal(0), max, correct: ok, answered: true };
}

export type GradableItem = { itemId: string; type: QuestionType; key: unknown; response: AnyResponse };

export type ExamGrade = {
  items: (Omit<ItemGrade, "awarded" | "max"> & { itemId: string; type: QuestionType; awarded: string; max: string })[];
  awardedRaw: string;
  maxRaw: string;
  scoreScaled: number;
  answeredCount: number;
  correctCount: number;
};

/** Single rounding point: awarded/max × 10000, half-up, clamped to [0, 10000]. */
export function toScaled(awarded: Decimal, max: Decimal): number {
  if (max.lte(0)) throw new Error("INVALID_MAX_POINTS");
  const scaled = awarded.div(max).times(MAX_SCALED).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  return Math.min(MAX_SCALED, Math.max(0, scaled));
}

export function gradeItem(item: GradableItem, rules: TypeRules): ItemGrade {
  if (item.type === "SINGLE_CHOICE") return gradeSingleChoice(item.response as SingleChoiceResponse, item.key as SingleChoiceKey, rules);
  if (item.type === "TRUE_FALSE") return gradeTrueFalse(item.response as TrueFalseResponse, item.key as TrueFalseKey, rules);
  return gradeShortAnswer(item.response as ShortAnswerResponse, item.key as ShortAnswerKey, rules);
}

export function gradeExam(items: GradableItem[], rules: TypeRules): ExamGrade {
  if (!items.length) throw new Error("EMPTY_EXAM");
  let awarded = new Decimal(0);
  let max = new Decimal(0);
  let answeredCount = 0;
  let correctCount = 0;
  const out: ExamGrade["items"] = [];
  for (const item of items) {
    const g = gradeItem(item, rules);
    awarded = awarded.plus(g.awarded);
    max = max.plus(g.max);
    if (g.answered) answeredCount++;
    if (g.correct) correctCount++;
    out.push({ ...g, itemId: item.itemId, type: item.type, awarded: g.awarded.toString(), max: g.max.toString() });
  }
  return { items: out, awardedRaw: awarded.toString(), maxRaw: max.toString(), scoreScaled: toScaled(awarded, max), answeredCount, correctCount };
}
