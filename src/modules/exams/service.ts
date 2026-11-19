import "server-only";
import Decimal from "decimal.js";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { escapeRegex, parseObjectId, type Pagination } from "@/lib/validation/common";
import { writeAudit } from "@/modules/audit/service";
import { maxPointsFor, sectionForType, typeRulesSchema } from "@/modules/grading/rule";
import { QuestionKeyModel, QuestionModel, QuestionVersionModel } from "@/modules/questions/model";
import { toStudentQuestionView, type StudentQuestionView } from "@/modules/questions/dto";
import type { Difficulty, QuestionType } from "@/modules/questions/types";
import { rejectSchema } from "@/modules/questions/validation";
import { SubjectModel } from "@/modules/subjects/model";
import { assertRole, isAdmin, type Actor } from "@/modules/users/permissions";
import { ExamModel, ScoringRuleModel } from "./model";
import { examDraftSchema, type ExamDraftInput, type ExamMode, type ExamStatus, type PublicExamQuery, type ReleasePolicy } from "./validation";

const STAFF = ["TEACHER", "ADMIN"] as const;
const EDITABLE: ExamStatus[] = ["DRAFT", "REJECTED"];

type ResolvedItem = {
  _id: Types.ObjectId;
  questionId: Types.ObjectId;
  questionVersionId: Types.ObjectId;
  type: QuestionType;
  sectionId: string | null;
  position: number;
  maxPoints: string;
};

/**
 * Resolve requested version ids into exam items. Only APPROVED versions (a question's current
 * published version) of the same subject and an allowed section type are eligible — students can
 * never reach unpublished content through an exam.
 */
async function resolveItems(subjectId: string, scoringRuleId: string, versionIds: string[], existing?: ResolvedItem[]) {
  const rule = await ScoringRuleModel.findById(scoringRuleId).lean();
  if (!rule || String(rule.subjectId) !== subjectId) throw errors.unprocessable("Quy tắc tính điểm không thuộc môn học đã chọn.");
  const typeRules = typeRulesSchema.parse(rule.typeRules);
  const sections = rule.sections.map((s) => ({ id: s.id ?? "", questionType: s.questionType as QuestionType }));
  const keep = new Map((existing ?? []).map((i) => [String(i.questionVersionId), i]));
  const ids = versionIds.map((v) => new Types.ObjectId(v));
  const questions = await QuestionModel.find(
    { $or: [{ publishedVersionId: { $in: ids } }, { _id: { $in: (existing ?? []).map((i) => i.questionId) } }] },
    { subjectId: 1, type: 1, publishedVersionId: 1, status: 1 },
  ).lean();
  const byPublished = new Map(questions.filter((q) => q.publishedVersionId).map((q) => [String(q.publishedVersionId), q]));
  const usedQuestions = new Set<string>();
  let total = new Decimal(0);
  const items: ResolvedItem[] = versionIds.map((vid, position) => {
    const prev = keep.get(vid);
    const q = byPublished.get(vid);
    // Items already in the exam may keep an older approved version (immutable); new ones must be current.
    if (!q && !prev) throw errors.unprocessable(`Câu hỏi ở vị trí ${position + 1} chưa được duyệt hoặc không tồn tại.`);
    const questionId = q?._id ?? prev!.questionId;
    const type = (q?.type ?? prev!.type) as QuestionType;
    if (q && String(q.subjectId) !== subjectId) throw errors.unprocessable(`Câu hỏi ở vị trí ${position + 1} không thuộc môn của đề.`);
    if (usedQuestions.has(String(questionId))) throw errors.unprocessable(`Câu hỏi ở vị trí ${position + 1} bị trùng (cùng câu hỏi gốc).`);
    usedQuestions.add(String(questionId));
    const sectionId = sectionForType(type, sections);
    if (!sectionId) throw errors.unprocessable(`Quy tắc tính điểm không có phần cho dạng câu ở vị trí ${position + 1}.`);
    const maxPoints = maxPointsFor(type, typeRules);
    total = total.plus(maxPoints);
    return { _id: prev?._id ?? new Types.ObjectId(), questionId, questionVersionId: new Types.ObjectId(vid), type, sectionId, position, maxPoints: maxPoints.toString() };
  });
  // Keep sections in rule order, preserving relative order inside each section.
  const order = new Map(sections.map((s, i) => [s.id, i]));
  items.sort((a, b) => (order.get(a.sectionId!) ?? 0) - (order.get(b.sectionId!) ?? 0) || a.position - b.position);
  items.forEach((it, i) => (it.position = i));
  return { items, totalMaxRawPoints: total.toString(), ruleStatus: rule.status };
}

function assertOwner(actor: Actor, e: { ownerId: Types.ObjectId }) {
  if (!isAdmin(actor) && String(e.ownerId) !== actor.id) throw errors.forbidden("Bạn chỉ được thao tác trên đề của mình.");
}

async function loadExam(id: string) {
  const e = await ExamModel.findById(parseObjectId(id, "Không tìm thấy đề thi.")).lean();
  if (!e) throw errors.notFound("Không tìm thấy đề thi.");
  return e;
}

export async function createExamDraft(actor: Actor, raw: ExamDraftInput, opts: { isDemo?: boolean } = {}): Promise<{ id: string }> {
  assertRole(actor, STAFF);
  const input = examDraftSchema.parse(raw);
  await connectToDatabase();
  if (!(await SubjectModel.exists({ _id: input.subjectId }))) throw errors.unprocessable("Môn học không tồn tại.");
  const { items, totalMaxRawPoints } = await resolveItems(input.subjectId, input.scoringRuleId, input.items.map((i) => i.questionVersionId));
  const doc = await ExamModel.create({
    ...input,
    durationMinutes: input.mode === "MOCK" ? input.durationMinutes : input.durationMinutes ?? null,
    items,
    totalMaxRawPoints,
    publishStatus: "DRAFT",
    createdBy: actor.id,
    ownerId: actor.id,
    isDemo: Boolean(opts.isDemo),
  });
  return { id: String(doc._id) };
}

export async function updateExamDraft(actor: Actor, id: string, raw: ExamDraftInput, expectedRevision: number): Promise<{ revision: number }> {
  assertRole(actor, STAFF);
  const input = examDraftSchema.parse(raw);
  await connectToDatabase();
  const exam = await loadExam(id);
  assertOwner(actor, exam);
  if (!EDITABLE.includes(exam.publishStatus)) throw errors.unprocessable("Đề đã gửi duyệt hoặc đã xuất bản nên không thể sửa. Hãy nhân bản để tạo bản nháp mới.");
  if (String(exam.subjectId) !== input.subjectId) throw errors.unprocessable("Không thể đổi môn học của đề.");
  const { items, totalMaxRawPoints } = await resolveItems(input.subjectId, input.scoringRuleId, input.items.map((i) => i.questionVersionId), exam.items as ResolvedItem[]);
  const updated = await ExamModel.findOneAndUpdate(
    { _id: exam._id, revision: expectedRevision, publishStatus: { $in: EDITABLE } },
    { $set: { ...input, items, totalMaxRawPoints, publishStatus: "DRAFT", reviewNotes: exam.reviewNotes }, $inc: { revision: 1 } },
    { returnDocument: "after", projection: { revision: 1 } },
  ).lean();
  if (!updated) throw errors.revisionConflict();
  return { revision: updated.revision };
}

/** Full validation used before review and again before publishing. */
async function assertExamPublishable(exam: Awaited<ReturnType<typeof loadExam>>) {
  if (!exam.items.length) throw errors.unprocessable("Đề chưa có câu hỏi nào.");
  if (exam.mode === "MOCK" && !exam.durationMinutes) throw errors.unprocessable("Đề thi thử cần thời gian làm bài.");
  const rule = await ScoringRuleModel.findById(exam.scoringRuleId, { status: 1, subjectId: 1 }).lean();
  if (!rule || rule.status !== "PUBLISHED") throw errors.unprocessable("Quy tắc tính điểm chưa được xuất bản.");
  if (String(rule.subjectId) !== String(exam.subjectId)) throw errors.unprocessable("Quy tắc tính điểm không thuộc môn của đề.");
  if (!new Decimal(exam.totalMaxRawPoints).gt(0)) throw errors.unprocessable("Tổng điểm tối đa của đề phải lớn hơn 0.");
  const versionIds = exam.items.map((i) => i.questionVersionId);
  const [versions, keys] = await Promise.all([
    QuestionVersionModel.countDocuments({ _id: { $in: versionIds }, isImmutable: true }),
    QuestionKeyModel.countDocuments({ questionVersionId: { $in: versionIds } }),
  ]);
  if (versions !== versionIds.length) throw errors.unprocessable("Đề chứa câu hỏi chưa được duyệt.");
  if (keys !== versionIds.length) throw errors.unprocessable("Đề chứa câu hỏi thiếu đáp án.");
}

export async function submitExamForReview(actor: Actor, id: string): Promise<void> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const exam = await loadExam(id);
  assertOwner(actor, exam);
  if (!EDITABLE.includes(exam.publishStatus)) throw errors.unprocessable("Chỉ gửi duyệt được đề ở trạng thái Nháp hoặc Bị từ chối.");
  await assertExamPublishable(exam);
  const r = await ExamModel.updateOne(
    { _id: exam._id, publishStatus: { $in: EDITABLE }, revision: exam.revision },
    { $set: { publishStatus: "PENDING_REVIEW", reviewNotes: null }, $inc: { revision: 1 } },
  );
  if (r.matchedCount !== 1) throw errors.revisionConflict();
  await writeAudit({ actorId: actor.id, action: "EXAM_SUBMITTED", entityType: "Exam", entityId: exam._id });
}

export async function approveExam(actor: Actor, id: string): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const exam = await loadExam(id);
  if (exam.publishStatus !== "PENDING_REVIEW") throw errors.unprocessable("Đề không ở trạng thái chờ duyệt.");
  await assertExamPublishable(exam);
  await mongoose.connection.transaction(async (session) => {
    const r = await ExamModel.updateOne(
      { _id: exam._id, publishStatus: "PENDING_REVIEW", revision: exam.revision },
      { $set: { publishStatus: "PUBLISHED", publishedAt: new Date(), reviewedBy: actor.id, reviewNotes: null }, $inc: { revision: 1 } },
      { session },
    );
    if (r.matchedCount !== 1) throw errors.revisionConflict();
    await QuestionVersionModel.updateMany({ _id: { $in: exam.items.map((i) => i.questionVersionId) } }, { $set: { isImmutable: true } }, { session });
  });
  await writeAudit({ actorId: actor.id, action: "EXAM_APPROVED", entityType: "Exam", entityId: exam._id });
}

export async function rejectExam(actor: Actor, id: string, raw: unknown): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  const { reason } = rejectSchema.parse(raw);
  await connectToDatabase();
  const r = await ExamModel.updateOne(
    { _id: parseObjectId(id, "Không tìm thấy đề thi."), publishStatus: "PENDING_REVIEW" },
    { $set: { publishStatus: "REJECTED", reviewNotes: reason, reviewedBy: actor.id }, $inc: { revision: 1 } },
  );
  if (r.matchedCount !== 1) throw errors.unprocessable("Đề không ở trạng thái chờ duyệt.");
  await writeAudit({ actorId: actor.id, action: "EXAM_REJECTED", entityType: "Exam", entityId: id });
}

/** Unpublish = soft archive. Refused while the exam belongs to an ACTIVE ranking campaign. */
export async function unpublishExam(actor: Actor, id: string): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const _id = new Types.ObjectId(parseObjectId(id, "Không tìm thấy đề thi."));
  const db = mongoose.connection.db;
  const inActive = db ? await db.collection("ranking_campaigns").countDocuments({ examIds: _id, status: "ACTIVE" }, { limit: 1 }) : 0;
  if (inActive) throw errors.unprocessable("Đề đang thuộc kỳ xếp hạng đang diễn ra nên không thể gỡ.");
  const r = await ExamModel.updateOne({ _id, publishStatus: "PUBLISHED" }, { $set: { publishStatus: "ARCHIVED" }, $inc: { revision: 1 } });
  if (r.matchedCount !== 1) throw errors.unprocessable("Chỉ gỡ được đề đã xuất bản.");
  await writeAudit({ actorId: actor.id, action: "EXAM_UNPUBLISHED", entityType: "Exam", entityId: _id });
}

/** Admin: manually release answers for ADMIN_MANUAL policy exams. */
export async function releaseExamResults(actor: Actor, id: string): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const r = await ExamModel.updateOne(
    { _id: parseObjectId(id, "Không tìm thấy đề thi."), resultsReleasedAt: null },
    { $set: { resultsReleasedAt: new Date() } },
  );
  if (r.matchedCount !== 1) throw errors.unprocessable("Đáp án đã được công bố trước đó.");
  await writeAudit({ actorId: actor.id, action: "EXAM_APPROVED", entityType: "Exam", entityId: id, metadata: { resultsReleased: true } });
}

/** Published exams are immutable; editing means cloning into a new draft. */
export async function cloneExam(actor: Actor, id: string): Promise<{ id: string }> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const e = await loadExam(id);
  if (!isAdmin(actor) && String(e.ownerId) !== actor.id && e.publishStatus !== "PUBLISHED") throw errors.forbidden();
  const doc = await ExamModel.create({
    title: `${e.title} (bản sao)`.slice(0, 150),
    description: e.description,
    subjectId: e.subjectId,
    examYear: e.examYear,
    mode: e.mode,
    difficulty: e.difficulty,
    durationMinutes: e.durationMinutes,
    items: e.items.map((i) => ({ ...i, _id: new Types.ObjectId() })),
    scoringRuleId: e.scoringRuleId,
    totalMaxRawPoints: e.totalMaxRawPoints,
    resultReleasePolicy: e.resultReleasePolicy,
    publishStatus: "DRAFT",
    createdBy: actor.id,
    ownerId: actor.id,
    clonedFrom: e._id,
    isDemo: e.isDemo,
  });
  return { id: String(doc._id) };
}

// ───────── reads ─────────

export type ExamItemPreview = { itemId: string; position: number; sectionId: string | null; maxPoints: string; questionVersionId: string; view: StudentQuestionView };

async function previewItems(items: ResolvedItem[]): Promise<ExamItemPreview[]> {
  const versions = await QuestionVersionModel.find({ _id: { $in: items.map((i) => i.questionVersionId) } }, { type: 1, content: 1, media: 1 }).lean();
  const vMap = new Map(versions.map((v) => [String(v._id), v]));
  return items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => {
      const v = vMap.get(String(i.questionVersionId));
      return {
        itemId: String(i._id),
        position: i.position,
        sectionId: i.sectionId,
        maxPoints: i.maxPoints,
        questionVersionId: String(i.questionVersionId),
        view: v ? toStudentQuestionView(v) : { type: "SHORT_ANSWER", stem: "(Không tìm thấy nội dung)", media: [] },
      };
    });
}

export type ExamEditorDto = {
  id: string;
  revision: number;
  status: ExamStatus;
  reviewNotes: string | null;
  ownerId: string;
  input: ExamDraftInput;
  totalMaxRawPoints: string;
  items: ExamItemPreview[];
};

export async function getExamForEditor(actor: Actor, id: string): Promise<ExamEditorDto> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const e = await loadExam(id);
  assertOwner(actor, e);
  return {
    id: String(e._id),
    revision: e.revision,
    status: e.publishStatus,
    reviewNotes: e.reviewNotes ?? null,
    ownerId: String(e.ownerId),
    totalMaxRawPoints: e.totalMaxRawPoints,
    input: {
      title: e.title,
      description: e.description,
      subjectId: String(e.subjectId),
      examYear: e.examYear,
      mode: e.mode,
      difficulty: (e.difficulty as Difficulty | null) ?? null,
      durationMinutes: e.durationMinutes ?? null,
      scoringRuleId: String(e.scoringRuleId),
      resultReleasePolicy: e.resultReleasePolicy,
      items: e.items.slice().sort((a, b) => a.position - b.position).map((i) => ({ questionVersionId: String(i.questionVersionId) })),
    },
    items: await previewItems(e.items as ResolvedItem[]),
  };
}

export type ManagedExamRow = {
  id: string;
  title: string;
  subjectName: string | null;
  mode: ExamMode;
  status: ExamStatus;
  itemCount: number;
  ownerName: string | null;
  updatedAt: string;
  isDemo: boolean;
};

export async function listManagedExams(actor: Actor, f: Pagination & { status?: ExamStatus; subjectId?: string; mine?: boolean }) {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (!isAdmin(actor) || f.mine) filter.ownerId = new Types.ObjectId(actor.id);
  if (f.status) filter.publishStatus = f.status;
  if (f.subjectId) filter.subjectId = new Types.ObjectId(parseObjectId(f.subjectId));
  const [rows, total] = await Promise.all([
    ExamModel.find(filter, { items: 0 })
      .sort({ updatedAt: -1 })
      .skip((f.page - 1) * f.limit)
      .limit(f.limit)
      .populate<{ subjectId: { name: string } | null }>("subjectId", "name")
      .populate<{ ownerId: { displayName: string } | null }>("ownerId", "displayName")
      .lean(),
    ExamModel.countDocuments(filter),
  ]);
  const counts = await ExamModel.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { _id: { $in: rows.map((r) => r._id) } } },
    { $project: { n: { $size: "$items" } } },
  ]);
  const cMap = new Map(counts.map((c) => [String(c._id), c.n]));
  const items: ManagedExamRow[] = rows.map((r) => ({
    id: String(r._id),
    title: r.title,
    subjectName: r.subjectId?.name ?? null,
    mode: r.mode,
    status: r.publishStatus,
    itemCount: cMap.get(String(r._id)) ?? 0,
    ownerName: r.ownerId?.displayName ?? null,
    updatedAt: (r.updatedAt as Date).toISOString(),
    isDemo: Boolean(r.isDemo),
  }));
  return { items, total };
}

export type ExamReviewDto = {
  id: string;
  title: string;
  subjectName: string | null;
  ownerName: string | null;
  mode: ExamMode;
  durationMinutes: number | null;
  totalMaxRawPoints: string;
  items: (ExamItemPreview & { key: unknown; explanation: string })[];
};

/** Admin review: content + keys in the secure admin context. */
export async function getExamForReview(actor: Actor, id: string): Promise<ExamReviewDto> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const e = await ExamModel.findById(parseObjectId(id, "Không tìm thấy đề thi."))
    .populate<{ subjectId: { name: string } | null }>("subjectId", "name")
    .populate<{ ownerId: { displayName: string } | null }>("ownerId", "displayName")
    .lean();
  if (!e) throw errors.notFound("Không tìm thấy đề thi.");
  const previews = await previewItems(e.items as ResolvedItem[]);
  const keys = await QuestionKeyModel.find({ questionVersionId: { $in: e.items.map((i) => i.questionVersionId) } }).lean();
  const kMap = new Map(keys.map((k) => [String(k.questionVersionId), k]));
  return {
    id: String(e._id),
    title: e.title,
    subjectName: e.subjectId?.name ?? null,
    ownerName: e.ownerId?.displayName ?? null,
    mode: e.mode,
    durationMinutes: e.durationMinutes ?? null,
    totalMaxRawPoints: e.totalMaxRawPoints,
    items: previews.map((p) => ({ ...p, key: kMap.get(p.questionVersionId)?.answerData ?? null, explanation: kMap.get(p.questionVersionId)?.explanation ?? "" })),
  };
}

// ───────── public ─────────

export type PublicExamCard = {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  mode: ExamMode;
  difficulty: Difficulty | null;
  examYear: number;
  durationMinutes: number | null;
  questionCount: number;
  attemptCount: number;
  publishedAt: string | null;
  isDemo: boolean;
};

const PUBLIC_FILTER = { publishStatus: "PUBLISHED" as const };

export async function listPublishedExams(q: PublicExamQuery): Promise<{ items: PublicExamCard[]; total: number }> {
  await connectToDatabase();
  const filter: Record<string, unknown> = { ...PUBLIC_FILTER };
  if (q.subjectId) filter.subjectId = new Types.ObjectId(q.subjectId);
  if (q.mode) filter.mode = q.mode;
  if (q.difficulty) filter.difficulty = q.difficulty;
  if (q.year) filter.examYear = q.year;
  if (q.q) filter.title = new RegExp(escapeRegex(q.q), "i");
  const [rows, total] = await Promise.all([
    ExamModel.aggregate<{
      _id: Types.ObjectId;
      title: string;
      subjectId: Types.ObjectId;
      mode: ExamMode;
      difficulty: Difficulty | null;
      examYear: number;
      durationMinutes: number | null;
      questionCount: number;
      attemptCount: number;
      publishedAt: Date | null;
      isDemo: boolean;
      subject: { name: string; slug: string; isActive: boolean }[];
    }>([
      { $match: filter },
      { $sort: { publishedAt: -1, _id: -1 } },
      { $skip: (q.page - 1) * q.limit },
      { $limit: q.limit },
      { $lookup: { from: "subjects", localField: "subjectId", foreignField: "_id", as: "subject", pipeline: [{ $project: { name: 1, slug: 1, isActive: 1 } }] } },
      {
        $project: {
          title: 1, subjectId: 1, mode: 1, difficulty: 1, examYear: 1, durationMinutes: 1, attemptCount: 1, publishedAt: 1, isDemo: 1, subject: 1,
          questionCount: { $size: "$items" },
        },
      },
    ]),
    ExamModel.countDocuments(filter),
  ]);
  return {
    total,
    items: rows.map((r) => ({
      id: String(r._id),
      title: r.title,
      subjectId: String(r.subjectId),
      subjectName: r.subject[0]?.name ?? "",
      subjectSlug: r.subject[0]?.slug ?? "",
      mode: r.mode,
      difficulty: r.difficulty ?? null,
      examYear: r.examYear,
      durationMinutes: r.durationMinutes ?? null,
      questionCount: r.questionCount,
      attemptCount: r.attemptCount ?? 0,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      isDemo: Boolean(r.isDemo),
    })),
  };
}

export type PublicExamDetail = PublicExamCard & {
  description: string;
  resultReleasePolicy: ReleasePolicy;
  ruleName: string;
  sections: { id: string; title: string; questionType: QuestionType; count: number; pointsEach: string }[];
  totalMaxRawPoints: string;
};

/** Metadata only — never question content or keys. */
export async function getPublishedExamDetail(id: string): Promise<PublicExamDetail | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  await connectToDatabase();
  const e = await ExamModel.findOne({ _id: id, ...PUBLIC_FILTER }).lean();
  if (!e) return null;
  const [subject, rule] = await Promise.all([
    SubjectModel.findById(e.subjectId, { name: 1, slug: 1 }).lean(),
    ScoringRuleModel.findById(e.scoringRuleId, { name: 1, sections: 1 }).lean(),
  ]);
  const sections = (rule?.sections ?? []).map((s) => {
    const its = e.items.filter((i) => i.sectionId === s.id);
    return { id: s.id ?? "", title: s.title ?? "", questionType: s.questionType as QuestionType, count: its.length, pointsEach: its[0]?.maxPoints ?? "0" };
  });
  return {
    id: String(e._id),
    title: e.title,
    description: e.description,
    subjectId: String(e.subjectId),
    subjectName: subject?.name ?? "",
    subjectSlug: subject?.slug ?? "",
    mode: e.mode,
    difficulty: (e.difficulty as Difficulty | null) ?? null,
    examYear: e.examYear,
    durationMinutes: e.durationMinutes ?? null,
    questionCount: e.items.length,
    attemptCount: e.attemptCount ?? 0,
    publishedAt: e.publishedAt ? e.publishedAt.toISOString() : null,
    isDemo: Boolean(e.isDemo),
    resultReleasePolicy: e.resultReleasePolicy,
    ruleName: rule?.name ?? "",
    sections: sections.filter((s) => s.count > 0),
    totalMaxRawPoints: e.totalMaxRawPoints,
  };
}

export async function countPublishedExamsBySubject(): Promise<Record<string, number>> {
  await connectToDatabase();
  const rows = await ExamModel.aggregate<{ _id: Types.ObjectId; n: number }>([{ $match: PUBLIC_FILTER }, { $group: { _id: "$subjectId", n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
}

/** Question picker for the exam builder: approved (published) questions of a subject. */
export async function listPickableQuestions(
  actor: Actor,
  f: Pagination & { subjectId: string; type?: QuestionType; difficulty?: Difficulty; topicId?: string; q?: string },
) {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    subjectId: new Types.ObjectId(parseObjectId(f.subjectId)),
    publishedVersionId: { $ne: null },
    status: { $ne: "ARCHIVED" },
  };
  if (f.type) filter.type = f.type;
  if (f.difficulty) filter.difficulty = f.difficulty;
  if (f.topicId) filter.topicIds = new Types.ObjectId(parseObjectId(f.topicId));
  if (f.q) filter.searchText = new RegExp(escapeRegex(f.q.toLowerCase()));
  const [rows, total] = await Promise.all([
    QuestionModel.find(filter, { type: 1, difficulty: 1, publishedVersionId: 1, isDemo: 1 }).sort({ updatedAt: -1 }).skip((f.page - 1) * f.limit).limit(f.limit).lean(),
    QuestionModel.countDocuments(filter),
  ]);
  const versions = await QuestionVersionModel.find({ _id: { $in: rows.map((r) => r.publishedVersionId!) } }, { type: 1, content: 1, media: 1, versionNumber: 1 }).lean();
  const vMap = new Map(versions.map((v) => [String(v._id), v]));
  return {
    total,
    items: rows.map((r) => {
      const v = vMap.get(String(r.publishedVersionId));
      return {
        questionId: String(r._id),
        questionVersionId: String(r.publishedVersionId),
        versionNumber: v?.versionNumber ?? 0,
        type: r.type,
        difficulty: r.difficulty,
        isDemo: Boolean(r.isDemo),
        view: v ? toStudentQuestionView(v) : null,
      };
    }),
  };
}

/** Admin: which of these published exams still await a manual answer release. */
export async function examsAwaitingManualRelease(actor: Actor, examIds: string[]): Promise<Set<string>> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const rows = await ExamModel.find(
    { _id: { $in: examIds.map((id) => new Types.ObjectId(parseObjectId(id))) }, resultReleasePolicy: "ADMIN_MANUAL", resultsReleasedAt: null },
    { _id: 1 },
  ).lean();
  return new Set(rows.map((r) => String(r._id)));
}
