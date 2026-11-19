import { approveQuestion, createQuestion, requestQuestionReview } from "@/modules/questions/service";
import { createScoringRule, publishScoringRule } from "@/modules/exams/scoring-service";
import { approveExam, createExamDraft, submitExamForReview } from "@/modules/exams/service";
import { DEMO_SECTIONS, DEMO_TYPE_RULES } from "@/modules/grading/rule";
import { QuestionModel } from "@/modules/questions/model";
import type { Actor } from "@/modules/users/permissions";
import { saInput, scInput, tfInput } from "./fixtures";

export async function approvedQuestion(teacher: Actor, admin: Actor, input: Parameters<typeof createQuestion>[1]) {
  const { id } = await createQuestion(teacher, input);
  await requestQuestionReview(teacher, id);
  await approveQuestion(admin, id);
  const q = await QuestionModel.findById(id).lean();
  return { questionId: id, versionId: String(q!.publishedVersionId) };
}

export async function publishedRule(admin: Actor, subjectId: string) {
  const r = await createScoringRule(admin, { name: "Quy tắc DEMO", subjectId, examYear: 2026, sections: DEMO_SECTIONS, typeRules: DEMO_TYPE_RULES });
  await publishScoringRule(admin, r.id);
  return r.id;
}

/**
 * Published MOCK exam with 3 questions: SC (correct "B"), TF (a,c true), SA ("1,5").
 * Perfect answers → 10.000; see `perfectAnswers`.
 */
export async function publishedExam(teacher: Actor, admin: Actor, subjectId: string, ruleId: string, opts: { title?: string; durationMinutes?: number; policy?: "AFTER_SUBMISSION" | "AFTER_CAMPAIGN_END" | "ADMIN_MANUAL" } = {}) {
  const sc = await approvedQuestion(teacher, admin, scInput(subjectId, [], `Câu ${Math.random()}`));
  const tf = await approvedQuestion(teacher, admin, tfInput(subjectId));
  const sa = await approvedQuestion(teacher, admin, saInput(subjectId));
  const { id } = await createExamDraft(teacher, {
    title: opts.title ?? "Đề DEMO",
    subjectId,
    examYear: 2026,
    mode: "MOCK",
    durationMinutes: opts.durationMinutes ?? 30,
    scoringRuleId: ruleId,
    resultReleasePolicy: opts.policy ?? "AFTER_SUBMISSION",
    items: [sc, tf, sa].map((q) => ({ questionVersionId: q.versionId })),
  });
  await submitExamForReview(teacher, id);
  await approveExam(admin, id);
  return id;
}

export const perfectAnswers = {
  SINGLE_CHOICE: { optionId: "B" },
  TRUE_FALSE: { values: { a: true, b: false, c: true, d: false } },
  SHORT_ANSWER: { text: "1.5" },
} as const;
