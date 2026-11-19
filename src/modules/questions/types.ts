/** Client-safe constants for questions. */
export const QUESTION_TYPES = ["SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Workflow status of the question's latest version. */
export const QUESTION_STATUSES = ["DRAFT", "IN_REVIEW", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Trắc nghiệm nhiều lựa chọn",
  TRUE_FALSE: "Trắc nghiệm đúng/sai",
  SHORT_ANSWER: "Trả lời ngắn",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  DRAFT: "Nháp",
  IN_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  ARCHIVED: "Đã lưu trữ",
};

export const OPTION_IDS = ["A", "B", "C", "D"] as const;
export type OptionId = (typeof OPTION_IDS)[number];
export const STATEMENT_IDS = ["a", "b", "c", "d"] as const;
export type StatementId = (typeof STATEMENT_IDS)[number];

export const MAX_MEDIA_BYTES = 3 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
