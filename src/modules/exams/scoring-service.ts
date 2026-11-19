import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { parseObjectId } from "@/lib/validation/common";
import { writeAudit } from "@/modules/audit/service";
import { SubjectModel } from "@/modules/subjects/model";
import { assertRole, type Actor } from "@/modules/users/permissions";
import { scoringRuleInputSchema, typeRulesSchema, type ScoringRuleInput, type TypeRules } from "@/modules/grading/rule";
import type { QuestionType } from "@/modules/questions/types";
import { ScoringRuleModel } from "./model";

export type ScoringRuleDto = {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string | null;
  examYear: number;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  sections: { id: string; title: string; questionType: QuestionType }[];
  typeRules: TypeRules;
  isDemo: boolean;
};

type RuleLean = {
  _id: Types.ObjectId;
  name: string;
  subjectId: Types.ObjectId | { _id: Types.ObjectId; name: string };
  examYear: number;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  sections: { id?: string | null; title?: string | null; questionType?: string | null }[];
  typeRules: unknown;
  isDemo?: boolean;
};

export function toRuleDto(r: RuleLean): ScoringRuleDto {
  const subj = r.subjectId as { _id?: Types.ObjectId; name?: string };
  return {
    id: String(r._id),
    name: r.name,
    subjectId: String(subj._id ?? r.subjectId),
    subjectName: subj.name ?? null,
    examYear: r.examYear,
    version: r.version,
    status: r.status,
    sections: r.sections.map((s) => ({ id: s.id ?? "", title: s.title ?? "", questionType: s.questionType as QuestionType })),
    typeRules: typeRulesSchema.parse(r.typeRules),
    isDemo: Boolean(r.isDemo),
  };
}

export async function listScoringRules(actor: Actor, filter: { subjectId?: string; publishedOnly?: boolean } = {}): Promise<ScoringRuleDto[]> {
  assertRole(actor, ["TEACHER", "ADMIN"]);
  await connectToDatabase();
  const q: Record<string, unknown> = {};
  if (filter.subjectId) q.subjectId = new Types.ObjectId(parseObjectId(filter.subjectId));
  if (filter.publishedOnly) q.status = "PUBLISHED";
  const rows = await ScoringRuleModel.find(q).sort({ examYear: -1, version: -1 }).limit(200).populate<{ subjectId: { _id: Types.ObjectId; name: string } }>("subjectId", "name").lean();
  return rows.map((r) => toRuleDto(r as unknown as RuleLean));
}

export async function getScoringRule(id: string): Promise<ScoringRuleDto> {
  await connectToDatabase();
  const r = await ScoringRuleModel.findById(parseObjectId(id, "Không tìm thấy quy tắc tính điểm.")).lean();
  if (!r) throw errors.notFound("Không tìm thấy quy tắc tính điểm.");
  return toRuleDto(r as unknown as RuleLean);
}

/** Creates a new DRAFT version (version = last + 1 for subject/year). */
export async function createScoringRule(actor: Actor, raw: ScoringRuleInput, opts: { isDemo?: boolean } = {}): Promise<ScoringRuleDto> {
  assertRole(actor, ["ADMIN"]);
  const input = scoringRuleInputSchema.parse(raw);
  await connectToDatabase();
  const subject = await SubjectModel.findById(input.subjectId, { allowedQuestionTypes: 1 }).lean();
  if (!subject) throw errors.unprocessable("Môn học không tồn tại.");
  for (const s of input.sections) {
    if (!(subject.allowedQuestionTypes ?? []).includes(s.questionType)) throw errors.unprocessable(`Môn học không cho phép dạng câu của phần ${s.id}.`);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const last = await ScoringRuleModel.findOne({ subjectId: input.subjectId, examYear: input.examYear }, { version: 1 }).sort({ version: -1 }).lean();
    try {
      const doc = await ScoringRuleModel.create({ ...input, version: (last?.version ?? 0) + 1, status: "DRAFT", createdBy: actor.id, isDemo: Boolean(opts.isDemo) });
      await writeAudit({ actorId: actor.id, action: "SCORING_RULE_CREATED", entityType: "ScoringRule", entityId: doc._id });
      return toRuleDto(doc.toObject() as unknown as RuleLean);
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
  throw errors.conflict("Không tạo được phiên bản mới, vui lòng thử lại.");
}

/** Published rules are immutable; to change, create a new version. */
export async function publishScoringRule(actor: Actor, id: string): Promise<void> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const r = await ScoringRuleModel.updateOne(
    { _id: parseObjectId(id, "Không tìm thấy quy tắc tính điểm."), status: "DRAFT" },
    { $set: { status: "PUBLISHED", publishedAt: new Date() } },
  );
  if (r.matchedCount !== 1) throw errors.unprocessable("Chỉ xuất bản được quy tắc ở trạng thái nháp.");
  await writeAudit({ actorId: actor.id, action: "SCORING_RULE_PUBLISHED", entityType: "ScoringRule", entityId: id });
}
