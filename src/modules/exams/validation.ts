import { z } from "zod";
import { objectIdSchema } from "@/lib/validation/common";
import { DIFFICULTIES } from "@/modules/questions/types";

export const EXAM_MODES = ["PRACTICE", "MOCK"] as const;
export type ExamMode = (typeof EXAM_MODES)[number];
export const EXAM_STATUSES = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];
export const RELEASE_POLICIES = ["AFTER_SUBMISSION", "AFTER_CAMPAIGN_END", "ADMIN_MANUAL"] as const;
export type ReleasePolicy = (typeof RELEASE_POLICIES)[number];

export const EXAM_MODE_LABELS: Record<ExamMode, string> = { PRACTICE: "Luyện tập", MOCK: "Thi thử" };
export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  DRAFT: "Nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Bị từ chối",
  ARCHIVED: "Đã gỡ",
};
export const RELEASE_POLICY_LABELS: Record<ReleasePolicy, string> = {
  AFTER_SUBMISSION: "Xem đáp án và lời giải ngay sau khi nộp bài",
  AFTER_CAMPAIGN_END: "Đáp án công bố sau khi kỳ xếp hạng kết thúc",
  ADMIN_MANUAL: "Đáp án công bố khi quản trị viên cho phép",
};

export const MAX_EXAM_ITEMS = 100;

export const examDraftSchema = z
  .object({
    title: z.string().trim().min(3, "Tên đề cần từ 3 ký tự").max(150),
    description: z.string().trim().max(2000).default(""),
    subjectId: objectIdSchema,
    examYear: z.number().int().min(2020).max(2100),
    mode: z.enum(EXAM_MODES),
    difficulty: z.enum(DIFFICULTIES).nullable().default(null),
    durationMinutes: z.number().int().min(5, "Thời gian tối thiểu 5 phút").max(300, "Thời gian tối đa 300 phút").nullable().default(null),
    scoringRuleId: objectIdSchema,
    resultReleasePolicy: z.enum(RELEASE_POLICIES).default("AFTER_SUBMISSION"),
    items: z
      .array(z.object({ questionVersionId: objectIdSchema }).strict())
      .max(MAX_EXAM_ITEMS, `Tối đa ${MAX_EXAM_ITEMS} câu`)
      .default([]),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.mode === "MOCK" && !v.durationMinutes) ctx.addIssue({ code: "custom", path: ["durationMinutes"], message: "Đề thi thử cần thời gian làm bài" });
    const seen = new Set<string>();
    v.items.forEach((it, i) => {
      if (seen.has(it.questionVersionId)) ctx.addIssue({ code: "custom", path: ["items", i], message: "Câu hỏi bị trùng trong đề" });
      seen.add(it.questionVersionId);
    });
  });
export type ExamDraftInput = z.input<typeof examDraftSchema>;

export const publicExamQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  subjectId: objectIdSchema.optional(),
  mode: z.enum(EXAM_MODES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  q: z.string().trim().max(100).optional(),
});
export type PublicExamQuery = z.infer<typeof publicExamQuerySchema>;
