import "server-only";
import { createHash } from "node:crypto";
import mongoose, { Types, type ClientSession } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { escapeRegex, parseObjectId, type Pagination } from "@/lib/validation/common";
import { assertMediaRefsAllowed } from "@/lib/cloudinary";
import { writeAudit } from "@/modules/audit/service";
import { SubjectModel, TopicModel } from "@/modules/subjects/model";
import { assertRole, isAdmin, type Actor } from "@/modules/users/permissions";
import { QuestionKeyModel, QuestionModel, QuestionVersionModel } from "./model";
import type { ManagedQuestionRow, QuestionEditorDto } from "./dto";
import { questionInputSchema, rejectSchema, type MediaRef, type QuestionBody, type QuestionInput } from "./validation";
import type { Difficulty, QuestionStatus, QuestionType } from "./types";

const STAFF = ["TEACHER", "ADMIN"] as const;

function splitBody(body: QuestionBody) {
  const { media, ...content } = body.content as QuestionBody["content"] & { media: MediaRef[] };
  const answerData = body.key;
  const contentHash = createHash("sha256").update(JSON.stringify({ type: body.type, content, media, answerData, e: body.explanation })).digest("hex");
  return { content, media: media.map((m) => ({ ...m, resourceType: "image" })), answerData, explanation: body.explanation, contentHash };
}

function searchTextOf(body: QuestionBody): string {
  return body.content.stem.normalize("NFC").toLowerCase().slice(0, 300);
}

async function assertSubjectAndTopics(subjectId: string, type: QuestionType, topicIds: string[]) {
  const subject = await SubjectModel.findById(subjectId, { allowedQuestionTypes: 1, isActive: 1 }).lean();
  if (!subject) throw errors.unprocessable("Môn học không tồn tại.");
  if (!(subject.allowedQuestionTypes ?? []).includes(type)) throw errors.unprocessable("Môn học này không cho phép dạng câu hỏi đã chọn.");
  if (topicIds.length) {
    const n = await TopicModel.countDocuments({ _id: { $in: topicIds }, subjectId });
    if (n !== new Set(topicIds).size) throw errors.unprocessable("Chủ đề không thuộc môn học đã chọn.");
  }
}

function assertCanEdit(actor: Actor, q: { ownerId: Types.ObjectId }) {
  if (!isAdmin(actor) && String(q.ownerId) !== actor.id) throw errors.forbidden("Bạn chỉ được thao tác trên câu hỏi của mình.");
}

async function loadQuestion(id: string) {
  const q = await QuestionModel.findById(parseObjectId(id, "Không tìm thấy câu hỏi.")).lean();
  if (!q) throw errors.notFound("Không tìm thấy câu hỏi.");
  return q;
}

function runTx<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  return mongoose.connection.transaction(fn);
}

export async function createQuestion(actor: Actor, raw: QuestionInput, opts: { isDemo?: boolean } = {}): Promise<{ id: string }> {
  assertRole(actor, STAFF);
  const { meta, body } = questionInputSchema.parse(raw);
  await connectToDatabase();
  await assertSubjectAndTopics(meta.subjectId, body.type, meta.topicIds);
  const parts = splitBody(body);
  if (!opts.isDemo) assertMediaRefsAllowed(parts.media);

  const id = await runTx(async (session) => {
    const [q] = await QuestionModel.create(
      [
        {
          subjectId: meta.subjectId,
          topicIds: meta.topicIds,
          type: body.type,
          difficulty: meta.difficulty,
          tags: meta.tags,
          createdBy: actor.id,
          ownerId: actor.id,
          status: "DRAFT",
          searchText: searchTextOf(body),
          isDemo: Boolean(opts.isDemo),
        },
      ],
      { session },
    );
    const [v] = await QuestionVersionModel.create(
      [{ questionId: q!._id, versionNumber: 1, type: body.type, content: parts.content, media: parts.media, createdBy: actor.id, contentHash: parts.contentHash }],
      { session },
    );
    await QuestionKeyModel.create([{ questionVersionId: v!._id, answerData: parts.answerData, explanation: parts.explanation }], { session });
    await QuestionModel.updateOne({ _id: q!._id }, { $set: { latestVersionId: v!._id } }, { session });
    return String(q!._id);
  });
  return { id };
}

/**
 * Save edits. If the latest version is immutable (approved or used by an exam) a NEW version is
 * created; otherwise the draft version is updated in place. Optimistic concurrency via `revision`.
 */
export async function updateQuestion(
  actor: Actor,
  id: string,
  raw: QuestionInput,
  expectedRevision: number,
  opts: { forceNewVersion?: boolean } = {},
): Promise<{ id: string; revision: number; versionNumber: number; createdNewVersion: boolean }> {
  assertRole(actor, STAFF);
  const { meta, body } = questionInputSchema.parse(raw);
  await connectToDatabase();
  const q = await loadQuestion(id);
  assertCanEdit(actor, q);
  if (q.status === "ARCHIVED") throw errors.unprocessable("Câu hỏi đã được lưu trữ, không thể sửa.");
  if (q.type !== body.type) throw errors.unprocessable("Không thể đổi dạng câu hỏi. Hãy tạo câu hỏi mới.");
  if (String(q.subjectId) !== meta.subjectId) throw errors.unprocessable("Không thể đổi môn học của câu hỏi.");
  if (q.revision !== expectedRevision) throw errors.revisionConflict({ currentRevision: q.revision });
  await assertSubjectAndTopics(meta.subjectId, body.type, meta.topicIds);
  const parts = splitBody(body);
  if (!q.isDemo) assertMediaRefsAllowed(parts.media);

  const latest = await QuestionVersionModel.findById(q.latestVersionId, { versionNumber: 1, isImmutable: 1, contentHash: 1 }).lean();
  if (!latest) throw errors.conflict("Dữ liệu câu hỏi không nhất quán.");
  const unchanged = latest.contentHash === parts.contentHash;
  const needNew = !unchanged && (latest.isImmutable || Boolean(opts.forceNewVersion));

  return runTx(async (session) => {
    let versionNumber = latest.versionNumber;
    let latestVersionId = latest._id;
    if (needNew) {
      versionNumber = latest.versionNumber + 1;
      const [v] = await QuestionVersionModel.create(
        [{ questionId: q._id, versionNumber, type: body.type, content: parts.content, media: parts.media, createdBy: actor.id, contentHash: parts.contentHash }],
        { session },
      );
      await QuestionKeyModel.create([{ questionVersionId: v!._id, answerData: parts.answerData, explanation: parts.explanation }], { session });
      latestVersionId = v!._id;
    } else if (!unchanged) {
      // Guard again inside the transaction: never mutate an immutable version.
      const r = await QuestionVersionModel.updateOne(
        { _id: latest._id, isImmutable: false },
        { $set: { content: parts.content, media: parts.media, contentHash: parts.contentHash } },
        { session },
      );
      if (r.matchedCount !== 1) throw errors.conflict("Phiên bản đã bị khóa. Vui lòng tải lại và lưu lại để tạo phiên bản mới.");
      await QuestionKeyModel.updateOne({ questionVersionId: latest._id }, { $set: { answerData: parts.answerData, explanation: parts.explanation } }, { session });
    }
    const contentChanged = !unchanged;
    // Any content change sends the question back to DRAFT (needs a new review); the previously
    // approved version stays published (publishedVersionId) until the new one is approved.
    const nextStatus: QuestionStatus = contentChanged ? "DRAFT" : q.status;
    const updated = await QuestionModel.findOneAndUpdate(
      { _id: q._id, revision: expectedRevision },
      {
        $set: {
          topicIds: meta.topicIds,
          difficulty: meta.difficulty,
          tags: meta.tags,
          latestVersionId,
          status: nextStatus,
          searchText: searchTextOf(body),
          ...(contentChanged ? { reviewNotes: null } : {}),
        },
        $inc: { revision: 1 },
      },
      { session, returnDocument: "after", projection: { revision: 1 } },
    ).lean();
    if (!updated) throw errors.revisionConflict();
    return { id: String(q._id), revision: updated.revision, versionNumber, createdNewVersion: needNew };
  });
}

export async function getQuestionForEditor(actor: Actor, id: string): Promise<QuestionEditorDto> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const q = await loadQuestion(id);
  assertCanEdit(actor, q);
  const [latest, published] = await Promise.all([
    QuestionVersionModel.findById(q.latestVersionId).lean(),
    q.publishedVersionId ? QuestionVersionModel.findById(q.publishedVersionId, { versionNumber: 1 }).lean() : null,
  ]);
  if (!latest) throw errors.conflict("Dữ liệu câu hỏi không nhất quán.");
  const key = await QuestionKeyModel.findOne({ questionVersionId: latest._id }).lean();
  const content = latest.content as Record<string, unknown>;
  return {
    id: String(q._id),
    revision: q.revision,
    status: q.status,
    reviewNotes: q.reviewNotes ?? null,
    latestVersionNumber: latest.versionNumber,
    latestVersionImmutable: latest.isImmutable,
    publishedVersionNumber: published?.versionNumber ?? null,
    ownerId: String(q.ownerId),
    meta: { subjectId: String(q.subjectId), topicIds: q.topicIds.map(String), difficulty: q.difficulty, tags: q.tags },
    body: {
      type: q.type,
      content: { ...content, media: (latest.media ?? []).map(({ publicId, secureUrl, width, height, format, bytes, alt }) => ({ publicId, secureUrl, width, height, format, bytes, alt })) },
      key: key?.answerData ?? null,
      explanation: key?.explanation ?? "",
    },
  };
}

export type ManagedQuestionFilters = Pagination & {
  subjectId?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  status?: QuestionStatus;
  q?: string;
  mine?: boolean;
};

export async function listManagedQuestions(actor: Actor, f: ManagedQuestionFilters): Promise<{ items: ManagedQuestionRow[]; total: number }> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (!isAdmin(actor) || f.mine) filter.ownerId = new Types.ObjectId(actor.id);
  if (f.subjectId) filter.subjectId = new Types.ObjectId(parseObjectId(f.subjectId));
  if (f.type) filter.type = f.type;
  if (f.difficulty) filter.difficulty = f.difficulty;
  if (f.status) filter.status = f.status;
  else filter.status = { $ne: "ARCHIVED" };
  if (f.q) filter.searchText = new RegExp(escapeRegex(f.q.toLowerCase()));
  const [rows, total] = await Promise.all([
    QuestionModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip((f.page - 1) * f.limit)
      .limit(f.limit)
      .populate<{ subjectId: { _id: Types.ObjectId; name: string } | null }>("subjectId", "name")
      .populate<{ ownerId: { _id: Types.ObjectId; displayName: string } | null }>("ownerId", "displayName")
      .lean(),
    QuestionModel.countDocuments(filter),
  ]);
  return {
    total,
    items: rows.map((r) => ({
      id: String(r._id),
      subjectId: r.subjectId ? String(r.subjectId._id) : "",
      subjectName: r.subjectId?.name ?? null,
      type: r.type,
      difficulty: r.difficulty,
      status: r.status,
      stemPreview: (r.searchText ?? "").slice(0, 140),
      ownerName: r.ownerId?.displayName ?? null,
      hasPublishedVersion: Boolean(r.publishedVersionId),
      updatedAt: (r.updatedAt as Date).toISOString(),
      isDemo: Boolean(r.isDemo),
    })),
  };
}

export async function requestQuestionReview(actor: Actor, id: string): Promise<void> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const q = await loadQuestion(id);
  assertCanEdit(actor, q);
  const r = await QuestionModel.updateOne(
    { _id: q._id, status: { $in: ["DRAFT", "REJECTED"] } },
    { $set: { status: "IN_REVIEW", reviewNotes: null }, $inc: { revision: 1 } },
  );
  if (r.matchedCount !== 1) throw errors.unprocessable("Chỉ gửi duyệt được câu hỏi ở trạng thái Nháp hoặc Bị từ chối.");
  await writeAudit({ actorId: actor.id, action: "QUESTION_SUBMITTED", entityType: "Question", entityId: q._id });
}

/** Admin approval publishes the latest version and freezes it (immutable). */
export async function approveQuestion(actor: Actor, id: string): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const q = await loadQuestion(id);
  if (q.status !== "IN_REVIEW") throw errors.unprocessable("Câu hỏi không ở trạng thái chờ duyệt.");
  await runTx(async (session) => {
    const r = await QuestionModel.updateOne(
      { _id: q._id, status: "IN_REVIEW", latestVersionId: q.latestVersionId },
      { $set: { status: "PUBLISHED", publishedVersionId: q.latestVersionId, reviewedBy: actor.id, reviewedAt: new Date(), reviewNotes: null }, $inc: { revision: 1 } },
      { session },
    );
    if (r.matchedCount !== 1) throw errors.conflict("Câu hỏi vừa được thay đổi. Vui lòng tải lại.");
    await QuestionVersionModel.updateOne({ _id: q.latestVersionId }, { $set: { isImmutable: true } }, { session });
  });
  await writeAudit({ actorId: actor.id, action: "QUESTION_APPROVED", entityType: "Question", entityId: q._id });
}

export async function rejectQuestion(actor: Actor, id: string, raw: unknown): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  const { reason } = rejectSchema.parse(raw);
  await connectToDatabase();
  const q = await loadQuestion(id);
  const r = await QuestionModel.updateOne(
    { _id: q._id, status: "IN_REVIEW" },
    { $set: { status: "REJECTED", reviewNotes: reason, reviewedBy: actor.id, reviewedAt: new Date() }, $inc: { revision: 1 } },
  );
  if (r.matchedCount !== 1) throw errors.unprocessable("Câu hỏi không ở trạng thái chờ duyệt.");
  await writeAudit({ actorId: actor.id, action: "QUESTION_REJECTED", entityType: "Question", entityId: q._id });
}

/** Soft delete. Versions referenced by exams/attempts stay intact. */
export async function archiveQuestion(actor: Actor, id: string): Promise<void> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const q = await loadQuestion(id);
  assertCanEdit(actor, q);
  await QuestionModel.updateOne({ _id: q._id }, { $set: { status: "ARCHIVED" }, $inc: { revision: 1 } });
  await writeAudit({ actorId: actor.id, action: "QUESTION_ARCHIVED", entityType: "Question", entityId: q._id });
}

export type ReviewQuestionDto = {
  id: string;
  subjectName: string | null;
  ownerName: string | null;
  type: QuestionType;
  difficulty: Difficulty;
  versionNumber: number;
  body: unknown;
  submittedAt: string;
};

/** Admin review queue with full content + key (secure admin context). */
export async function listQuestionReviewQueue(actor: Actor, p: Pagination): Promise<{ items: ReviewQuestionDto[]; total: number }> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const filter = { status: "IN_REVIEW" as const };
  const [rows, total] = await Promise.all([
    QuestionModel.find(filter)
      .sort({ updatedAt: 1 })
      .skip((p.page - 1) * p.limit)
      .limit(p.limit)
      .populate<{ subjectId: { name: string } | null }>("subjectId", "name")
      .populate<{ ownerId: { displayName: string } | null }>("ownerId", "displayName")
      .lean(),
    QuestionModel.countDocuments(filter),
  ]);
  const versionIds = rows.map((r) => r.latestVersionId).filter((v): v is Types.ObjectId => Boolean(v));
  const [versions, keys] = await Promise.all([
    QuestionVersionModel.find({ _id: { $in: versionIds } }).lean(),
    QuestionKeyModel.find({ questionVersionId: { $in: versionIds } }).lean(),
  ]);
  const vMap = new Map(versions.map((v) => [String(v._id), v]));
  const kMap = new Map(keys.map((k) => [String(k.questionVersionId), k]));
  return {
    total,
    items: rows.map((r) => {
      const v = vMap.get(String(r.latestVersionId));
      const k = kMap.get(String(r.latestVersionId));
      return {
        id: String(r._id),
        subjectName: r.subjectId?.name ?? null,
        ownerName: r.ownerId?.displayName ?? null,
        type: r.type,
        difficulty: r.difficulty,
        versionNumber: v?.versionNumber ?? 0,
        body: { type: r.type, content: { ...(v?.content as object), media: v?.media ?? [] }, key: k?.answerData ?? null, explanation: k?.explanation ?? "" },
        submittedAt: (r.updatedAt as Date).toISOString(),
      };
    }),
  };
}

export async function teacherQuestionCounts(actor: Actor): Promise<Record<QuestionStatus, number>> {
  assertRole(actor, STAFF);
  await connectToDatabase();
  const rows = await QuestionModel.aggregate<{ _id: QuestionStatus; n: number }>([
    { $match: { ownerId: new Types.ObjectId(actor.id) } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const out: Record<QuestionStatus, number> = { DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 0, REJECTED: 0, ARCHIVED: 0 };
  for (const r of rows) out[r._id] = r.n;
  return out;
}
