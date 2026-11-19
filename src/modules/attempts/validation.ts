import { z } from "zod";
import { objectIdSchema } from "@/lib/validation/common";
import { DIFFICULTIES, OPTION_IDS, QUESTION_TYPES } from "@/modules/questions/types";

export const ATTEMPT_STATUSES = ["IN_PROGRESS", "SUBMITTED", "EXPIRED", "FINALIZED"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];
export const TERMINAL_STATUSES: AttemptStatus[] = ["SUBMITTED", "EXPIRED", "FINALIZED"];
export const ATTEMPT_STATUS_LABELS: Record<AttemptStatus, string> = {
  IN_PROGRESS: "Đang làm",
  SUBMITTED: "Đã nộp",
  EXPIRED: "Hết giờ",
  FINALIZED: "Đã chốt",
};

/** Per-type response payloads (validated against the item's type on the server). */
export const singleChoiceResponseSchema = z.object({ optionId: z.enum(OPTION_IDS).nullable() }).strict();
const tfValue = z.boolean().nullable().optional();
export const trueFalseResponseSchema = z.object({ values: z.object({ a: tfValue, b: tfValue, c: tfValue, d: tfValue }).strict() }).strict();
export const shortAnswerResponseSchema = z.object({ text: z.string().max(100, "Câu trả lời tối đa 100 ký tự") }).strict();

export const startAttemptSchema = z
  .object({
    examId: objectIdSchema,
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, "idempotencyKey không hợp lệ"),
  })
  .strict();

export const MAX_ANSWERS_PER_SAVE = 100;
export const saveAnswersSchema = z
  .object({
    revision: z.number().int().min(0),
    answers: z.record(objectIdSchema, z.unknown().nullable()).refine((r) => Object.keys(r).length <= MAX_ANSWERS_PER_SAVE, "Quá nhiều câu trong một lần lưu"),
    marked: z.array(objectIdSchema).max(MAX_ANSWERS_PER_SAVE).optional(),
  })
  .strict();
export type SaveAnswersInput = z.infer<typeof saveAnswersSchema>;

export const submitAttemptSchema = z.object({ revision: z.number().int().min(0).optional() }).strict();

export const PRACTICE_MIN = 5;
export const PRACTICE_MAX = 40;
export const practiceSessionSchema = z
  .object({
    subjectId: objectIdSchema,
    topicIds: z.array(objectIdSchema).max(10).default([]),
    difficulty: z.enum(DIFFICULTIES).nullable().default(null),
    types: z.array(z.enum(QUESTION_TYPES)).max(3).default([]),
    count: z.number().int().min(PRACTICE_MIN, `Tối thiểu ${PRACTICE_MIN} câu`).max(PRACTICE_MAX, `Tối đa ${PRACTICE_MAX} câu`),
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  })
  .strict();
export type PracticeSessionInput = z.input<typeof practiceSessionSchema>;
