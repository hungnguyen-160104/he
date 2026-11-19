import "server-only";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { isUnlimitedMode } from "@/lib/env";
import { AppError, errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { parseObjectId, type Pagination } from "@/lib/validation/common";
import { gradeExam, type AnyResponse } from "@/modules/grading/engine";
import { maxPointsFor, typeRulesSchema, type TypeRules } from "@/modules/grading/rule";
import { ExamModel, ScoringRuleModel } from "@/modules/exams/model";
import type { ReleasePolicy } from "@/modules/exams/validation";
import { QuestionKeyModel, QuestionModel, QuestionVersionModel } from "@/modules/questions/model";
import { toStudentQuestionView, type StudentQuestionView } from "@/modules/questions/dto";
import type { QuestionType, StatementId } from "@/modules/questions/types";
import { RankingCampaignModel } from "@/modules/rankings/model";
import { SubjectModel } from "@/modules/subjects/model";
import type { Actor } from "@/modules/users/permissions";
import { AttemptModel, UserExamProgressModel } from "./model";
import {
  practiceSessionSchema,
  saveAnswersSchema,
  shortAnswerResponseSchema,
  singleChoiceResponseSchema,
  startAttemptSchema,
  TERMINAL_STATUSES,
  trueFalseResponseSchema,
  type AttemptStatus,
  type PracticeSessionInput,
} from "./validation";

const MAX_IN_PROGRESS = 5;

type SnapshotItem = { itemId: string; questionId: Types.ObjectId; questionVersionId: Types.ObjectId; type: QuestionType; sectionId: string | null; position: number; maxPoints: string };

const isTerminal = (s: AttemptStatus) => TERMINAL_STATUSES.includes(s);
const isExpired = (a: { expiresAt?: Date | null }, now: Date) => Boolean(a.expiresAt && a.expiresAt.getTime() <= now.getTime());

async function loadOwnAttempt(actor: Actor, id: string) {
  const a = await AttemptModel.findById(parseObjectId(id, "Không tìm thấy lượt làm bài.")).lean();
  // Ownership: another user's attempt is reported as not found (no existence leak).
  if (!a || String(a.userId) !== actor.id) throw errors.notFound("Không tìm thấy lượt làm bài.");
  return a;
}

function sectionOrder(items: SnapshotItem[], sections: { id?: string | null }[]): SnapshotItem[] {
  const order = new Map(sections.map((s, i) => [s.id ?? "", i]));
  return items
    .slice()
    .sort((a, b) => (order.get(a.sectionId ?? "") ?? 0) - (order.get(b.sectionId ?? "") ?? 0) || a.position - b.position)
    .map((it, i) => ({ ...it, position: i }));
}

// ───────────────────────── start ─────────────────────────

export type StartResult = { attemptId: string; resumed: boolean };

export async function startExamAttempt(actor: Actor, raw: unknown, now = new Date()): Promise<StartResult> {
  const input = startAttemptSchema.parse(raw);
  await enforceRateLimit(RATE_LIMITS.attemptStartByUser, actor.id);
  await connectToDatabase();
  const userId = new Types.ObjectId(actor.id);

  const byKey = await AttemptModel.findOne({ userId, idempotencyKey: input.idempotencyKey }, { _id: 1, examId: 1 }).lean();
  if (byKey) {
    if (String(byKey.examId) !== input.examId) throw errors.conflict("idempotencyKey đã được dùng cho đề khác.");
    return { attemptId: String(byKey._id), resumed: true };
  }

  // Only PUBLISHED exams; ids of drafts/unpublished content behave as "not found".
  const exam = await ExamModel.findOne({ _id: input.examId, publishStatus: "PUBLISHED" }).lean();
  if (!exam) throw errors.notFound("Không tìm thấy đề thi hoặc đề chưa được xuất bản.");

  const open = await AttemptModel.findOne({ userId, examId: exam._id, status: "IN_PROGRESS" }, { _id: 1, expiresAt: 1 }).lean();
  if (open) {
    if (!isExpired(open, now)) return { attemptId: String(open._id), resumed: true };
    await finalizeAttempt(String(open._id), "RECONCILED", now);
  }
  const unlimited = isUnlimitedMode();
  const inProgress = unlimited ? 0 : await AttemptModel.countDocuments({ userId, status: "IN_PROGRESS", $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
  if (inProgress >= MAX_IN_PROGRESS) throw errors.conflict("Bạn đang có quá nhiều bài làm dở. Hãy hoàn thành hoặc nộp bớt trước khi bắt đầu bài mới.");

  const rule = await ScoringRuleModel.findById(exam.scoringRuleId).lean();
  if (!rule) throw errors.conflict("Đề thi thiếu quy tắc tính điểm.");
  const campaigns = await RankingCampaignModel.find(
    { examIds: exam._id, status: "ACTIVE", periodStartAt: { $lte: now }, periodEndAt: { $gt: now } },
    { _id: 1 },
  ).lean();

  const attemptId = new Types.ObjectId();
  const items: SnapshotItem[] = exam.items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => ({
      itemId: String(i._id),
      questionId: i.questionId,
      questionVersionId: i.questionVersionId,
      type: i.type,
      sectionId: i.sectionId ?? null,
      position: i.position,
      maxPoints: i.maxPoints,
    }));

  try {
    await mongoose.connection.transaction(async (session) => {
      // Atomic "first attempt" registration: exactly one attempt can win $setOnInsert.
      const progress = await UserExamProgressModel.findOneAndUpdate(
        { userId, examId: exam._id },
        { $setOnInsert: { firstAttemptId: attemptId, firstStartedAt: now }, $inc: { attemptCount: 1 }, $set: { lastAttemptId: attemptId } },
        { upsert: true, returnDocument: "after", session },
      ).lean();
      const isFirst = String(progress?.firstAttemptId) === String(attemptId);
      const rankEligible = isFirst && actor.role === "STUDENT";
      await AttemptModel.create(
        [
          {
            _id: attemptId,
            userId,
            userRole: actor.role,
            kind: "EXAM",
            examId: exam._id,
            examRevision: exam.revision,
            subjectId: exam.subjectId,
            title: exam.title,
            mode: exam.mode,
            scoringRuleId: rule._id,
            typeRules: rule.typeRules,
            sections: rule.sections,
            items,
            resultReleasePolicy: exam.resultReleasePolicy,
            startedAt: now,
            // UNLIMITED_MODE (local testing): untimed — no countdown, no auto-submit.
            expiresAt: !unlimited && exam.mode === "MOCK" && exam.durationMinutes ? new Date(now.getTime() + exam.durationMinutes * 60_000) : null,
            status: "IN_PROGRESS",
            answers: {},
            isFirstRankedAttempt: isFirst,
            rankEligible,
            rankingCampaignIds: rankEligible ? campaigns.map((c) => c._id) : [],
            idempotencyKey: input.idempotencyKey,
            isDemo: exam.isDemo,
          },
        ],
        { session },
      );
      await ExamModel.updateOne({ _id: exam._id }, { $inc: { attemptCount: 1 } }, { session });
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      // Same idempotency key raced in another request: return that attempt.
      const again = await AttemptModel.findOne({ userId, idempotencyKey: input.idempotencyKey }, { _id: 1 }).lean();
      if (again) return { attemptId: String(again._id), resumed: true };
    }
    throw err;
  }
  return { attemptId: String(attemptId), resumed: false };
}

export async function getPracticeOptions() {
  await connectToDatabase();
  const [subjects, counts, rules] = await Promise.all([
    SubjectModel.find({ isActive: true }, { name: 1, slug: 1, allowedQuestionTypes: 1, sortOrder: 1 }).sort({ sortOrder: 1, name: 1 }).lean(),
    QuestionModel.aggregate<{ _id: { s: Types.ObjectId; t: QuestionType }; n: number }>([
      { $match: { publishedVersionId: { $ne: null }, status: { $ne: "ARCHIVED" } } },
      { $group: { _id: { s: "$subjectId", t: "$type" }, n: { $sum: 1 } } },
    ]),
    ScoringRuleModel.distinct("subjectId", { status: "PUBLISHED" }),
  ]);
  const ruleSet = new Set(rules.map(String));
  return subjects.map((s) => {
    const byType: Partial<Record<QuestionType, number>> = {};
    for (const c of counts) if (String(c._id.s) === String(s._id)) byType[c._id.t] = c.n;
    return {
      id: String(s._id),
      name: s.name,
      slug: s.slug,
      allowedQuestionTypes: (s.allowedQuestionTypes ?? []) as QuestionType[],
      publishedByType: byType,
      totalPublished: Object.values(byType).reduce((a, b) => a + (b ?? 0), 0),
      hasScoringRule: ruleSet.has(String(s._id)),
    };
  });
}

/** Practice session from the approved bank. Never ranked. Reports the real number of questions. */
export async function startPracticeSession(actor: Actor, raw: PracticeSessionInput, now = new Date()): Promise<StartResult & { requested: number; actual: number }> {
  const input = practiceSessionSchema.parse(raw);
  await enforceRateLimit(RATE_LIMITS.attemptStartByUser, actor.id);
  await connectToDatabase();
  const userId = new Types.ObjectId(actor.id);
  const byKey = await AttemptModel.findOne({ userId, idempotencyKey: input.idempotencyKey }, { _id: 1, items: 1 }).lean();
  if (byKey) return { attemptId: String(byKey._id), resumed: true, requested: input.count, actual: byKey.items.length };

  const subject = await SubjectModel.findOne({ _id: input.subjectId, isActive: true }, { name: 1 }).lean();
  if (!subject) throw errors.notFound("Không tìm thấy môn học.");
  const rule = await ScoringRuleModel.findOne({ subjectId: subject._id, status: "PUBLISHED" }).sort({ examYear: -1, version: -1 }).lean();
  if (!rule) throw errors.unprocessable("Môn học chưa có quy tắc tính điểm được xuất bản nên chưa thể luyện tập.");
  const typeRules = typeRulesSchema.parse(rule.typeRules);
  const ruleTypes = rule.sections.map((s) => s.questionType as QuestionType);
  const types = (input.types.length ? input.types.filter((t) => ruleTypes.includes(t)) : ruleTypes) as QuestionType[];

  const match: Record<string, unknown> = { subjectId: subject._id, publishedVersionId: { $ne: null }, status: { $ne: "ARCHIVED" }, type: { $in: types } };
  if (input.topicIds.length) match.topicIds = { $in: input.topicIds.map((t) => new Types.ObjectId(t)) };
  if (input.difficulty) match.difficulty = input.difficulty;
  const picked = await QuestionModel.aggregate<{ _id: Types.ObjectId; publishedVersionId: Types.ObjectId; type: QuestionType }>([
    { $match: match },
    { $sample: { size: input.count } },
    { $project: { publishedVersionId: 1, type: 1 } },
  ]);
  if (!picked.length) throw errors.unprocessable("Chưa có câu hỏi đã duyệt phù hợp với bộ lọc. Hãy thử bỏ bớt điều kiện chủ đề/độ khó.");

  const items = sectionOrder(
    picked.map((q, i) => ({
      itemId: String(new Types.ObjectId()),
      questionId: q._id,
      questionVersionId: q.publishedVersionId,
      type: q.type,
      sectionId: rule.sections.find((s) => s.questionType === q.type)?.id ?? null,
      position: i,
      maxPoints: maxPointsFor(q.type, typeRules).toString(),
    })),
    rule.sections,
  );
  try {
    const doc = await AttemptModel.create({
      userId,
      userRole: actor.role,
      kind: "PRACTICE",
      examId: null,
      subjectId: subject._id,
      title: `Luyện tập — ${subject.name}`,
      mode: "PRACTICE",
      scoringRuleId: rule._id,
      typeRules: rule.typeRules,
      sections: rule.sections,
      items,
      resultReleasePolicy: "AFTER_SUBMISSION",
      startedAt: now,
      expiresAt: null,
      status: "IN_PROGRESS",
      answers: {},
      idempotencyKey: input.idempotencyKey,
    });
    return { attemptId: String(doc._id), resumed: false, requested: input.count, actual: items.length };
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      const again = await AttemptModel.findOne({ userId, idempotencyKey: input.idempotencyKey }, { _id: 1, items: 1 }).lean();
      if (again) return { attemptId: String(again._id), resumed: true, requested: input.count, actual: again.items.length };
    }
    throw err;
  }
}

// ───────────────────────── taking ─────────────────────────

export type AttemptItemView = { itemId: string; position: number; sectionId: string | null; maxPoints: string; view: StudentQuestionView };
export type AttemptTakingDto = {
  id: string;
  title: string;
  kind: "EXAM" | "PRACTICE";
  mode: "PRACTICE" | "MOCK";
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string | null;
  serverTime: string;
  revision: number;
  sections: { id: string; title: string }[];
  items: AttemptItemView[];
  answers: Record<string, unknown>;
  marked: string[];
};

async function loadItemViews(items: SnapshotItem[]): Promise<AttemptItemView[]> {
  const versions = await QuestionVersionModel.find({ _id: { $in: items.map((i) => i.questionVersionId) } }, { type: 1, content: 1, media: 1 }).lean();
  const vMap = new Map(versions.map((v) => [String(v._id), v]));
  return items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => {
      const v = vMap.get(String(i.questionVersionId));
      return {
        itemId: i.itemId,
        position: i.position,
        sectionId: i.sectionId,
        maxPoints: i.maxPoints,
        view: v ? toStudentQuestionView(v) : { type: "SHORT_ANSWER", stem: "(Nội dung không còn tồn tại)", media: [] },
      };
    });
}

/**
 * Resume view. If the server clock passed `expiresAt`, the attempt is finalized from saved answers
 * and the caller should go to the result page. Never includes keys or explanations.
 */
export async function getAttemptForTaking(actor: Actor, id: string, now = new Date()): Promise<AttemptTakingDto> {
  await connectToDatabase();
  let a = await loadOwnAttempt(actor, id);
  if (a.status === "IN_PROGRESS" && isExpired(a, now)) {
    await finalizeAttempt(String(a._id), "EXPIRED", now);
    a = await loadOwnAttempt(actor, id);
  }
  return {
    id: String(a._id),
    title: a.title,
    kind: a.kind,
    mode: a.mode,
    status: a.status,
    startedAt: a.startedAt.toISOString(),
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    serverTime: now.toISOString(),
    revision: a.revision,
    sections: a.sections.map((s) => ({ id: s.id ?? "", title: s.title ?? "" })),
    items: await loadItemViews(a.items as SnapshotItem[]),
    answers: (a.answers ?? {}) as Record<string, unknown>,
    marked: a.marked ?? [],
  };
}

function validateResponse(type: QuestionType, raw: unknown): unknown {
  if (raw === null) return null;
  const schema = type === "SINGLE_CHOICE" ? singleChoiceResponseSchema : type === "TRUE_FALSE" ? trueFalseResponseSchema : shortAnswerResponseSchema;
  const r = schema.safeParse(raw);
  if (!r.success) throw errors.validation(undefined, "Câu trả lời không đúng định dạng của dạng câu hỏi.");
  return r.data;
}

/** Autosave: owner + IN_PROGRESS + not expired + snapshot items only + optimistic revision. */
export async function saveAnswers(actor: Actor, id: string, raw: unknown, now = new Date()): Promise<{ revision: number; savedAt: string; serverTime: string }> {
  const input = saveAnswersSchema.parse(raw);
  await enforceRateLimit(RATE_LIMITS.autosaveByUser, actor.id);
  await connectToDatabase();
  const a = await loadOwnAttempt(actor, id);
  if (isTerminal(a.status)) throw new AppError("ATTEMPT_CLOSED", "Bài làm đã được nộp, không thể sửa câu trả lời.", 409);
  if (isExpired(a, now)) {
    await finalizeAttempt(String(a._id), "EXPIRED", now);
    throw new AppError("ATTEMPT_EXPIRED", "Đã hết giờ làm bài. Bài đã được nộp tự động với các câu đã lưu.", 409);
  }
  const itemTypes = new Map((a.items as SnapshotItem[]).map((i) => [i.itemId, i.type]));
  const $set: Record<string, unknown> = {};
  for (const [itemId, resp] of Object.entries(input.answers)) {
    const type = itemTypes.get(itemId);
    if (!type) throw errors.badRequest("Câu hỏi không thuộc bài làm này.");
    $set[`answers.${itemId}`] = validateResponse(type, resp);
  }
  if (input.marked) {
    if (input.marked.some((m) => !itemTypes.has(m))) throw errors.badRequest("Câu đánh dấu không thuộc bài làm này.");
    $set.marked = [...new Set(input.marked)];
  }
  const updated = await AttemptModel.findOneAndUpdate(
    {
      _id: a._id,
      userId: a.userId,
      status: "IN_PROGRESS",
      revision: input.revision,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    },
    { $set, $inc: { revision: 1 } },
    { returnDocument: "after", projection: { revision: 1 } },
  ).lean();
  if (!updated) {
    const fresh = await AttemptModel.findById(a._id, { revision: 1, status: 1, expiresAt: 1, answers: 1, marked: 1 }).lean();
    if (fresh && fresh.status === "IN_PROGRESS" && !isExpired(fresh, now)) {
      throw errors.revisionConflict({ currentRevision: fresh.revision, answers: fresh.answers, marked: fresh.marked });
    }
    throw new AppError("ATTEMPT_CLOSED", "Bài làm đã kết thúc.", 409);
  }
  return { revision: updated.revision, savedAt: now.toISOString(), serverTime: now.toISOString() };
}

/**
 * Finalize EXACTLY once: grade from saved answers + private keys + frozen rule, then a conditional
 * transition IN_PROGRESS → terminal guarded by revision. Concurrent callers get the same result.
 */
export async function finalizeAttempt(attemptId: string, reason: "SUBMITTED" | "EXPIRED" | "RECONCILED", now = new Date()) {
  for (let tries = 0; tries < 4; tries++) {
    const a = await AttemptModel.findById(attemptId).lean();
    if (!a) throw errors.notFound("Không tìm thấy lượt làm bài.");
    if (isTerminal(a.status)) return a;
    const expired = isExpired(a, now);
    const items = a.items as SnapshotItem[];
    const keys = await QuestionKeyModel.find({ questionVersionId: { $in: items.map((i) => i.questionVersionId) } }, { questionVersionId: 1, answerData: 1 }).lean();
    const kMap = new Map(keys.map((k) => [String(k.questionVersionId), k.answerData]));
    const typeRules: TypeRules = typeRulesSchema.parse(a.typeRules);
    const answers = (a.answers ?? {}) as Record<string, AnyResponse>;
    for (const i of items) if (!kMap.has(String(i.questionVersionId))) throw errors.conflict("Thiếu đáp án của câu hỏi; vui lòng liên hệ quản trị viên.");
    const grade = gradeExam(
      items.map((i) => ({ itemId: i.itemId, type: i.type, key: kMap.get(String(i.questionVersionId)), response: answers[i.itemId] ?? null })),
      typeRules,
    );
    const status: AttemptStatus = expired ? "EXPIRED" : "SUBMITTED";
    const finalizedAt = expired ? a.expiresAt! : now;
    const updated = await AttemptModel.findOneAndUpdate(
      { _id: a._id, status: "IN_PROGRESS", revision: a.revision },
      {
        $set: {
          status,
          gradeResult: grade,
          scoreScaled: grade.scoreScaled,
          submittedAt: !expired && reason === "SUBMITTED" ? now : null,
          finalizedAt,
          finalizeReason: expired ? (reason === "RECONCILED" ? "RECONCILED" : "EXPIRED") : reason,
        },
        $inc: { revision: 1 },
      },
      { returnDocument: "after" },
    ).lean();
    if (updated) return updated;
  }
  throw errors.conflict("Không thể nộp bài do dữ liệu đang thay đổi. Vui lòng thử lại.");
}

export async function submitAttempt(actor: Actor, id: string, now = new Date()) {
  await enforceRateLimit(RATE_LIMITS.submitByUser, actor.id);
  await connectToDatabase();
  const a = await loadOwnAttempt(actor, id);
  const done = await finalizeAttempt(String(a._id), "SUBMITTED", now);
  return { attemptId: String(done._id), status: done.status as AttemptStatus, scoreScaled: done.scoreScaled ?? 0 };
}

/** Batch-safe reconciliation of expired attempts (no cron needed). Returns remaining count. */
export async function reconcileExpiredAttempts(opts: { limit?: number; examIds?: Types.ObjectId[]; userId?: string } = {}, now = new Date()) {
  await connectToDatabase();
  const filter: Record<string, unknown> = { status: "IN_PROGRESS", expiresAt: { $ne: null, $lte: now } };
  if (opts.examIds) filter.examId = { $in: opts.examIds };
  if (opts.userId) filter.userId = new Types.ObjectId(opts.userId);
  const batch = await AttemptModel.find(filter, { _id: 1 }).sort({ expiresAt: 1 }).limit(opts.limit ?? 50).lean();
  let processed = 0;
  for (const b of batch) {
    try {
      await finalizeAttempt(String(b._id), "RECONCILED", now);
      processed++;
    } catch (err) {
      logger.error("attempts.reconcile_failed", { attemptId: String(b._id), code: err instanceof AppError ? err.code : "unknown" });
    }
  }
  const remaining = await AttemptModel.countDocuments(filter);
  return { processed, remaining };
}

// ───────────────────────── results ─────────────────────────

/**
 * Release policy (spec §6.6). For exams in a running ranking campaign, per-item correctness,
 * correct answers and explanations are withheld until the campaign ends — for everyone.
 */
export async function resolveRelease(a: { kind: string; examId?: Types.ObjectId | null }, now = new Date()): Promise<{ released: boolean; reason?: string; releaseAt?: string | null }> {
  if (a.kind === "PRACTICE" || !a.examId) return { released: true };
  const [exam, campaigns] = await Promise.all([
    ExamModel.findById(a.examId, { resultReleasePolicy: 1, resultsReleasedAt: 1 }).lean(),
    RankingCampaignModel.find({ examIds: a.examId, status: { $in: ["ACTIVE", "DRAFT"] }, periodEndAt: { $gt: now } }, { periodEndAt: 1, status: 1 }).lean(),
  ]);
  const policy = (exam?.resultReleasePolicy ?? "AFTER_SUBMISSION") as ReleasePolicy;
  const blocking = campaigns.filter((c) => c.status === "ACTIVE");
  if (blocking.length) {
    const end = new Date(Math.max(...blocking.map((c) => c.periodEndAt.getTime())));
    return { released: false, reason: "Đề đang thuộc kỳ xếp hạng chưa kết thúc. Đáp án và lời giải sẽ được công bố sau khi kỳ kết thúc.", releaseAt: end.toISOString() };
  }
  if (policy === "ADMIN_MANUAL" && !exam?.resultsReleasedAt) {
    return { released: false, reason: "Đáp án của đề này sẽ được công bố khi quản trị viên cho phép.", releaseAt: null };
  }
  if (policy === "AFTER_CAMPAIGN_END" && campaigns.length) {
    const end = new Date(Math.max(...campaigns.map((c) => c.periodEndAt.getTime())));
    return { released: false, reason: "Đáp án sẽ được công bố sau khi kỳ xếp hạng kết thúc.", releaseAt: end.toISOString() };
  }
  return { released: true };
}

export type ResultItemDto = {
  itemId: string;
  position: number;
  sectionId: string | null;
  view: StudentQuestionView;
  response: unknown;
  awarded: string;
  max: string;
  correct: boolean | null;
  answered: boolean;
  correctCount?: number;
  statementResults?: Record<StatementId, boolean | null>;
  key: unknown;
  explanation: string;
};

export type AttemptResultDto = {
  id: string;
  title: string;
  kind: "EXAM" | "PRACTICE";
  mode: "PRACTICE" | "MOCK";
  examId: string | null;
  status: AttemptStatus;
  startedAt: string;
  finalizedAt: string | null;
  durationMs: number | null;
  scoreScaled: number;
  answeredCount: number;
  totalItems: number;
  isFirstRankedAttempt: boolean;
  rankEligible: boolean;
  released: boolean;
  withheldReason: string | null;
  releaseAt: string | null;
  sections: { id: string; title: string }[];
  typeStats: { type: QuestionType; total: number; answered: number; correct: number | null }[];
  items: ResultItemDto[] | null;
};

export async function getAttemptResult(actor: Actor, id: string, now = new Date()): Promise<AttemptResultDto> {
  await connectToDatabase();
  let a = await loadOwnAttempt(actor, id);
  if (a.status === "IN_PROGRESS") {
    if (!isExpired(a, now)) throw new AppError("CONFLICT", "Bài làm chưa được nộp.", 409);
    await finalizeAttempt(String(a._id), "EXPIRED", now);
    a = await loadOwnAttempt(actor, id);
  }
  const grade = a.gradeResult as {
    items: { itemId: string; awarded: string; max: string; correct: boolean | null; answered: boolean; correctCount?: number; statementResults?: Record<StatementId, boolean | null> }[];
    answeredCount: number;
  };
  const release = await resolveRelease(a, now);
  const items = a.items as SnapshotItem[];
  const gMap = new Map(grade.items.map((g) => [g.itemId, g]));
  const typeStats = (["SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"] as QuestionType[])
    .map((type) => {
      const its = items.filter((i) => i.type === type);
      return {
        type,
        total: its.length,
        answered: its.filter((i) => gMap.get(i.itemId)?.answered).length,
        correct: release.released ? its.filter((i) => gMap.get(i.itemId)?.correct === true).length : null,
      };
    })
    .filter((s) => s.total > 0);

  let resultItems: ResultItemDto[] | null = null;
  if (release.released) {
    const views = await loadItemViews(items);
    const keys = await QuestionKeyModel.find({ questionVersionId: { $in: items.map((i) => i.questionVersionId) } }).lean();
    const kMap = new Map(keys.map((k) => [String(k.questionVersionId), k]));
    const answers = (a.answers ?? {}) as Record<string, unknown>;
    resultItems = views.map((v) => {
      const it = items.find((i) => i.itemId === v.itemId)!;
      const g = gMap.get(v.itemId);
      const k = kMap.get(String(it.questionVersionId));
      return {
        itemId: v.itemId,
        position: v.position,
        sectionId: v.sectionId,
        view: v.view,
        response: answers[v.itemId] ?? null,
        awarded: g?.awarded ?? "0",
        max: g?.max ?? it.maxPoints,
        correct: g?.correct ?? null,
        answered: Boolean(g?.answered),
        correctCount: g?.correctCount,
        statementResults: g?.statementResults,
        key: k?.answerData ?? null,
        explanation: k?.explanation ?? "",
      };
    });
  }
  return {
    id: String(a._id),
    title: a.title,
    kind: a.kind,
    mode: a.mode,
    examId: a.examId ? String(a.examId) : null,
    status: a.status,
    startedAt: a.startedAt.toISOString(),
    finalizedAt: a.finalizedAt ? a.finalizedAt.toISOString() : null,
    durationMs: a.finalizedAt ? a.finalizedAt.getTime() - a.startedAt.getTime() : null,
    scoreScaled: a.scoreScaled ?? 0,
    answeredCount: grade.answeredCount,
    totalItems: items.length,
    isFirstRankedAttempt: a.isFirstRankedAttempt,
    rankEligible: a.rankEligible,
    released: release.released,
    withheldReason: release.reason ?? null,
    releaseAt: release.releaseAt ?? null,
    sections: a.sections.map((s) => ({ id: s.id ?? "", title: s.title ?? "" })),
    typeStats,
    items: resultItems,
  };
}

// ───────────────────────── history & stats ─────────────────────────

export type AttemptHistoryRow = {
  id: string;
  title: string;
  kind: "EXAM" | "PRACTICE";
  mode: "PRACTICE" | "MOCK";
  subjectName: string | null;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string | null;
  finalizedAt: string | null;
  scoreScaled: number | null;
  totalItems: number;
  isFirstRankedAttempt: boolean;
};

export async function listMyAttempts(actor: Actor, f: Pagination & { subjectId?: string; mode?: "PRACTICE" | "MOCK"; status?: "IN_PROGRESS" | "DONE" }) {
  await connectToDatabase();
  await reconcileExpiredAttempts({ userId: actor.id, limit: 20 });
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(actor.id) };
  if (f.subjectId) filter.subjectId = new Types.ObjectId(parseObjectId(f.subjectId));
  if (f.mode) filter.mode = f.mode;
  if (f.status === "IN_PROGRESS") filter.status = "IN_PROGRESS";
  if (f.status === "DONE") filter.status = { $in: TERMINAL_STATUSES };
  const [rows, total] = await Promise.all([
    AttemptModel.find(filter, { title: 1, kind: 1, mode: 1, subjectId: 1, status: 1, startedAt: 1, expiresAt: 1, finalizedAt: 1, scoreScaled: 1, isFirstRankedAttempt: 1, items: 1 })
      .sort({ startedAt: -1 })
      .skip((f.page - 1) * f.limit)
      .limit(f.limit)
      .populate<{ subjectId: { name: string } | null }>("subjectId", "name")
      .lean(),
    AttemptModel.countDocuments(filter),
  ]);
  const items: AttemptHistoryRow[] = rows.map((r) => ({
    id: String(r._id),
    title: r.title,
    kind: r.kind,
    mode: r.mode,
    subjectName: r.subjectId?.name ?? null,
    status: r.status,
    startedAt: r.startedAt.toISOString(),
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    finalizedAt: r.finalizedAt ? r.finalizedAt.toISOString() : null,
    scoreScaled: r.scoreScaled ?? null,
    totalItems: r.items.length,
    isFirstRankedAttempt: r.isFirstRankedAttempt,
  }));
  return { items, total };
}

export async function getMyStats(actor: Actor) {
  await connectToDatabase();
  const userId = new Types.ObjectId(actor.id);
  const [agg] = await AttemptModel.aggregate<{
    totals: { _id: null; completed: number; avg: number | null; best: number | null }[];
    bySubject: { _id: Types.ObjectId; attempts: number; avg: number }[];
    inProgress: { n: number }[];
  }>([
    { $match: { userId } },
    {
      $facet: {
        totals: [{ $match: { status: { $in: TERMINAL_STATUSES } } }, { $group: { _id: null, completed: { $sum: 1 }, avg: { $avg: "$scoreScaled" }, best: { $max: "$scoreScaled" } } }],
        bySubject: [
          { $match: { status: { $in: TERMINAL_STATUSES } } },
          { $group: { _id: "$subjectId", attempts: { $sum: 1 }, avg: { $avg: "$scoreScaled" } } },
          { $sort: { attempts: -1 } },
          { $limit: 12 },
        ],
        inProgress: [{ $match: { status: "IN_PROGRESS" } }, { $count: "n" }],
      },
    },
  ]);
  const subjects = await SubjectModel.find({ _id: { $in: agg?.bySubject.map((s) => s._id) ?? [] } }, { name: 1 }).lean();
  const names = new Map(subjects.map((s) => [String(s._id), s.name]));
  const t = agg?.totals[0];
  return {
    completed: t?.completed ?? 0,
    averageScaled: t?.avg != null ? Math.round(t.avg) : null,
    bestScaled: t?.best ?? null,
    inProgress: agg?.inProgress[0]?.n ?? 0,
    bySubject: (agg?.bySubject ?? []).map((s) => ({ subjectId: String(s._id), subjectName: names.get(String(s._id)) ?? "", attempts: s.attempts, averageScaled: Math.round(s.avg) })),
  };
}
