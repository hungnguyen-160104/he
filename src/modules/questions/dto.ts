import type { OptionId, QuestionType, StatementId } from "./types";

/**
 * Student-facing question content. Built ONLY from question_versions with an explicit
 * allow-list — no answer keys, explanations, owner ids or review notes.
 */
export type StudentMedia = { secureUrl: string; width: number; height: number; alt: string };
export type StudentQuestionView =
  | { type: "SINGLE_CHOICE"; stem: string; options: { id: OptionId; text: string }[]; media: StudentMedia[] }
  | { type: "TRUE_FALSE"; stem: string; statements: { id: StatementId; text: string }[]; media: StudentMedia[] }
  | { type: "SHORT_ANSWER"; stem: string; media: StudentMedia[] };

type VersionLike = {
  type: string;
  content: unknown;
  media?: { secureUrl: string; width: number; height: number; alt: string }[] | null;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function toStudentQuestionView(v: VersionLike): StudentQuestionView {
  const c = (v.content ?? {}) as Record<string, unknown>;
  const media = (v.media ?? []).map((m) => ({ secureUrl: m.secureUrl, width: m.width, height: m.height, alt: m.alt }));
  const stem = str(c.stem);
  const type = v.type as QuestionType;
  if (type === "SINGLE_CHOICE") {
    const options = (Array.isArray(c.options) ? c.options : []).map((o: { id?: unknown; text?: unknown }) => ({ id: str(o.id) as OptionId, text: str(o.text) }));
    return { type, stem, options, media };
  }
  if (type === "TRUE_FALSE") {
    const statements = (Array.isArray(c.statements) ? c.statements : []).map((s: { id?: unknown; text?: unknown }) => ({
      id: str(s.id) as StatementId,
      text: str(s.text),
    }));
    return { type, stem, statements, media };
  }
  return { type: "SHORT_ANSWER", stem, media };
}

export type ManagedQuestionRow = {
  id: string;
  subjectId: string;
  subjectName: string | null;
  type: QuestionType;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  stemPreview: string;
  ownerName: string | null;
  hasPublishedVersion: boolean;
  updatedAt: string;
  isDemo: boolean;
};

/** Editor view: includes the key — only returned to the owner or an admin. */
export type QuestionEditorDto = {
  id: string;
  revision: number;
  status: ManagedQuestionRow["status"];
  reviewNotes: string | null;
  latestVersionNumber: number;
  latestVersionImmutable: boolean;
  publishedVersionNumber: number | null;
  ownerId: string;
  meta: { subjectId: string; topicIds: string[]; difficulty: "EASY" | "MEDIUM" | "HARD"; tags: string[] };
  body: unknown;
};
