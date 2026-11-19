import "server-only";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { parseObjectId } from "@/lib/validation/common";
import { writeAudit } from "@/modules/audit/service";
import { assertRole, type Actor } from "@/modules/users/permissions";
import type { QuestionType } from "@/modules/questions/types";
import { SubjectModel, TopicModel } from "./model";
import {
  subjectInputSchema,
  subjectPatchSchema,
  topicInputSchema,
  topicPatchSchema,
  type SubjectInput,
  type TopicInput,
} from "./validation";

export type SubjectDto = {
  id: string;
  name: string;
  slug: string;
  code: string;
  allowedQuestionTypes: QuestionType[];
  examYearsSupported: number[];
  isActive: boolean;
  sortOrder: number;
  isDemo: boolean;
};

export type TopicDto = {
  id: string;
  subjectId: string;
  parentId: string | null;
  name: string;
  slug: string;
  grade: number | null;
  sortOrder: number;
  isActive: boolean;
};

type SubjectLean = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  code: string;
  allowedQuestionTypes?: string[];
  examYearsSupported?: number[];
  isActive?: boolean;
  sortOrder?: number;
  isDemo?: boolean;
};
type TopicLean = {
  _id: Types.ObjectId;
  subjectId: Types.ObjectId;
  parentId?: Types.ObjectId | null;
  name: string;
  slug: string;
  grade?: number | null;
  sortOrder?: number;
  isActive?: boolean;
};

export const toSubjectDto = (s: SubjectLean): SubjectDto => ({
  id: String(s._id),
  name: s.name,
  slug: s.slug,
  code: s.code,
  allowedQuestionTypes: (s.allowedQuestionTypes ?? []) as QuestionType[],
  examYearsSupported: s.examYearsSupported ?? [],
  isActive: s.isActive ?? true,
  sortOrder: s.sortOrder ?? 0,
  isDemo: Boolean(s.isDemo),
});

export const toTopicDto = (t: TopicLean): TopicDto => ({
  id: String(t._id),
  subjectId: String(t.subjectId),
  parentId: t.parentId ? String(t.parentId) : null,
  name: t.name,
  slug: t.slug,
  grade: t.grade ?? null,
  sortOrder: t.sortOrder ?? 0,
  isActive: t.isActive ?? true,
});

// ───────── Public reads ─────────

export async function listActiveSubjects(): Promise<SubjectDto[]> {
  await connectToDatabase();
  const rows = await SubjectModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return rows.map(toSubjectDto);
}

export async function getSubjectBySlug(slug: string): Promise<SubjectDto | null> {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  await connectToDatabase();
  const s = await SubjectModel.findOne({ slug, isActive: true }).lean();
  return s ? toSubjectDto(s) : null;
}

export async function getSubjectById(id: string): Promise<SubjectDto | null> {
  await connectToDatabase();
  const s = await SubjectModel.findById(parseObjectId(id, "Không tìm thấy môn học.")).lean();
  return s ? toSubjectDto(s) : null;
}

export async function listTopics(subjectId: string, opts: { includeInactive?: boolean } = {}): Promise<TopicDto[]> {
  const id = parseObjectId(subjectId, "Không tìm thấy môn học.");
  await connectToDatabase();
  const filter: Record<string, unknown> = { subjectId: id };
  if (!opts.includeInactive) filter.isActive = true;
  const rows = await TopicModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  return rows.map(toTopicDto);
}

// ───────── Admin ─────────

export async function adminListSubjects(actor: Actor): Promise<SubjectDto[]> {
  assertRole(actor, ["ADMIN", "TEACHER"]);
  await connectToDatabase();
  const rows = await SubjectModel.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  return rows.map(toSubjectDto);
}

function duplicate(err: unknown, message: string): never {
  if ((err as { code?: number }).code === 11000) throw errors.conflict(message);
  throw err;
}

export async function createSubject(actor: Actor, raw: SubjectInput): Promise<SubjectDto> {
  assertRole(actor, ["ADMIN"]);
  const input = subjectInputSchema.parse(raw);
  await connectToDatabase();
  try {
    const doc = await SubjectModel.create(input);
    await writeAudit({ actorId: actor.id, action: "SUBJECT_CREATED", entityType: "Subject", entityId: doc._id, metadata: { slug: input.slug } });
    return toSubjectDto(doc.toObject());
  } catch (err) {
    duplicate(err, "Slug hoặc mã môn đã tồn tại.");
  }
}

export async function updateSubject(actor: Actor, id: string, raw: Partial<SubjectInput>): Promise<SubjectDto> {
  assertRole(actor, ["ADMIN"]);
  const input = subjectPatchSchema.parse(raw);
  await connectToDatabase();
  try {
    const doc = await SubjectModel.findByIdAndUpdate(parseObjectId(id, "Không tìm thấy môn học."), { $set: input }, { returnDocument: "after", runValidators: true }).lean();
    if (!doc) throw errors.notFound("Không tìm thấy môn học.");
    await writeAudit({ actorId: actor.id, action: "SUBJECT_UPDATED", entityType: "Subject", entityId: doc._id, metadata: { fields: Object.keys(input) } });
    return toSubjectDto(doc);
  } catch (err) {
    duplicate(err, "Slug hoặc mã môn đã tồn tại.");
  }
}

/** Collections that reference a subject; used to refuse hard deletes. */
async function countSubjectRefs(subjectId: Types.ObjectId): Promise<number> {
  const db = mongoose.connection.db;
  if (!db) return 1;
  const names = ["topics", "questions", "exams", "ranking_campaigns", "scoring_rules"];
  const counts = await Promise.all(names.map((n) => db.collection(n).countDocuments({ subjectId }, { limit: 1 })));
  return counts.reduce((a, b) => a + b, 0);
}

export async function deleteSubject(actor: Actor, id: string): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const _id = new Types.ObjectId(parseObjectId(id, "Không tìm thấy môn học."));
  if (!(await SubjectModel.exists({ _id }))) throw errors.notFound("Không tìm thấy môn học.");
  if (await countSubjectRefs(_id)) {
    throw errors.unprocessable("Môn học đã có chủ đề, câu hỏi hoặc đề thi nên không thể xóa. Hãy tắt trạng thái hoạt động thay vì xóa.");
  }
  await SubjectModel.deleteOne({ _id });
  await writeAudit({ actorId: actor.id, action: "SUBJECT_UPDATED", entityType: "Subject", entityId: _id, metadata: { deleted: true } });
}

export async function createTopic(actor: Actor, raw: TopicInput): Promise<TopicDto> {
  assertRole(actor, ["ADMIN"]);
  const input = topicInputSchema.parse(raw);
  await connectToDatabase();
  if (!(await SubjectModel.exists({ _id: input.subjectId }))) throw errors.unprocessable("Môn học không tồn tại.");
  if (input.parentId) {
    const parent = await TopicModel.findById(input.parentId, { subjectId: 1, parentId: 1 }).lean();
    if (!parent || String(parent.subjectId) !== input.subjectId) throw errors.unprocessable("Chủ đề cha không hợp lệ.");
    if (parent.parentId) throw errors.unprocessable("Chỉ hỗ trợ tối đa 2 cấp chủ đề.");
  }
  try {
    const doc = await TopicModel.create(input);
    await writeAudit({ actorId: actor.id, action: "TOPIC_CREATED", entityType: "Topic", entityId: doc._id, metadata: { slug: input.slug } });
    return toTopicDto(doc.toObject());
  } catch (err) {
    duplicate(err, "Slug chủ đề đã tồn tại trong cùng cấp.");
  }
}

export async function updateTopic(actor: Actor, id: string, raw: Partial<TopicInput>): Promise<TopicDto> {
  assertRole(actor, ["ADMIN"]);
  const input = topicPatchSchema.parse(raw);
  await connectToDatabase();
  try {
    const doc = await TopicModel.findByIdAndUpdate(parseObjectId(id, "Không tìm thấy chủ đề."), { $set: input }, { returnDocument: "after", runValidators: true }).lean();
    if (!doc) throw errors.notFound("Không tìm thấy chủ đề.");
    await writeAudit({ actorId: actor.id, action: "TOPIC_UPDATED", entityType: "Topic", entityId: doc._id, metadata: { fields: Object.keys(input) } });
    return toTopicDto(doc);
  } catch (err) {
    duplicate(err, "Slug chủ đề đã tồn tại trong cùng cấp.");
  }
}

export async function deleteTopic(actor: Actor, id: string): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const _id = new Types.ObjectId(parseObjectId(id, "Không tìm thấy chủ đề."));
  if (!(await TopicModel.exists({ _id }))) throw errors.notFound("Không tìm thấy chủ đề.");
  const db = mongoose.connection.db;
  const [children, questions] = await Promise.all([
    TopicModel.countDocuments({ parentId: _id }),
    db ? db.collection("questions").countDocuments({ topicIds: _id }, { limit: 1 }) : Promise.resolve(1),
  ]);
  if (children || questions) throw errors.unprocessable("Chủ đề đang có chủ đề con hoặc câu hỏi nên không thể xóa. Hãy tắt hoạt động thay vì xóa.");
  await TopicModel.deleteOne({ _id });
  await writeAudit({ actorId: actor.id, action: "TOPIC_UPDATED", entityType: "Topic", entityId: _id, metadata: { deleted: true } });
}
