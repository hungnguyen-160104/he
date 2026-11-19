/**
 * Shared builders for DEMO exam content (THPT graduation exam format from 2025).
 * Each content file calls `createBuilders()` once so its answer-letter spread is deterministic
 * and independent of other files.
 */
import type { QuestionInput } from "@/modules/questions/validation";

type Body = QuestionInput["body"];
export type Opt = "A" | "B" | "C" | "D";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type DemoQuestion = { part: "I" | "II" | "III"; topic: number; difficulty: Difficulty; body: Body };
export type DemoExam = {
  slug: string;
  subjectName: string;
  title: string;
  durationMinutes: number;
  /** Points per part-III item (Toán 0.5; other subjects with part III 0.25). Unused when there is no part III. */
  shortAnswerPoints: string;
  topics: string[];
  description: string;
  questions: DemoQuestion[];
};
export type TfStatements = [[string, boolean], [string, boolean], [string, boolean], [string, boolean]];

export const DEMO_NOTE =
  "Đề DEMO mô phỏng cấu trúc, định dạng đề thi tốt nghiệp THPT từ năm 2025. Câu hỏi do hệ thống biên soạn để thử nghiệm, không phải đề thi chính thức của Bộ GD&ĐT.";

/** Topic slug used by the seed (Topic.slug max length is 60). */
export function topicSlug(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const OPTS: Opt[] = ["A", "B", "C", "D"];
/** Deterministic spread of correct answers over A–D (so the key is not always the same letter). */
const TARGETS = [1, 3, 0, 2, 2, 0, 3, 1, 0, 2, 1, 3];

export function createBuilders() {
  let mcCounter = 0;
  /**
   * `options` as authored, `correct` = id of the right one in that order. The correct option is then
   * swapped into a target position. Explanations must not refer to options by letter.
   */
  function mc(topic: number, difficulty: Difficulty, stem: string, options: [string, string, string, string], correct: Opt, explanation: string): DemoQuestion {
    const opts = [...options];
    const from = OPTS.indexOf(correct);
    const to = TARGETS[mcCounter++ % TARGETS.length]!;
    [opts[from], opts[to]] = [opts[to]!, opts[from]!];
    return {
      part: "I",
      topic,
      difficulty,
      body: { type: "SINGLE_CHOICE", content: { stem, options: OPTS.map((id, i) => ({ id, text: opts[i]! })), media: [] }, key: { correctOptionId: OPTS[to]! }, explanation },
    };
  }

  function tf(topic: number, difficulty: Difficulty, stem: string, s: TfStatements, explanation: string): DemoQuestion {
    const ids = ["a", "b", "c", "d"] as const;
    return {
      part: "II",
      topic,
      difficulty,
      body: {
        type: "TRUE_FALSE",
        content: { stem, statements: ids.map((id, i) => ({ id, text: s[i]![0] })), media: [] },
        key: { values: { a: s[0][1], b: s[1][1], c: s[2][1], d: s[3][1] } },
        explanation,
      },
    };
  }

  /** Numeric short answer (≤ 4 characters on the answer sheet, decimal comma). */
  function sa(topic: number, difficulty: Difficulty, stem: string, answer: string, explanation: string): DemoQuestion {
    return {
      part: "III",
      topic,
      difficulty,
      body: { type: "SHORT_ANSWER", content: { stem, media: [] }, key: { answerType: "NUMBER", acceptedAnswers: [answer], tolerance: null, caseSensitive: false }, explanation },
    };
  }

  return { mc, tf, sa };
}
