import "server-only";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { errors } from "@/lib/errors";
import { objectIdSchema, parseObjectId } from "@/lib/validation/common";
import { PERIOD_TYPES, periodBounds, periodLabel, type PeriodType } from "@/lib/utils/period";
import { writeAudit } from "@/modules/audit/service";
import { AttemptModel } from "@/modules/attempts/model";
import { reconcileExpiredAttempts } from "@/modules/attempts/service";
import { ExamModel } from "@/modules/exams/model";
import { SubjectModel } from "@/modules/subjects/model";
import { UserModel } from "@/modules/users/model";
import { assertRole, type Actor } from "@/modules/users/permissions";
import { RankingCampaignModel, RankingSnapshotModel } from "./model";

export const CALCULATION_VERSION = 1;
export const ANONYMOUS_NAME = "Học sinh ẩn danh";

export const campaignInputSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    subjectId: objectIdSchema,
    periodType: z.enum(PERIOD_TYPES),
    /** Any instant inside the desired period; bounds are computed in Asia/Ho_Chi_Minh. */
    referenceDate: z.iso.datetime({ offset: true }),
    examIds: z.array(objectIdSchema).min(1, "Chọn ít nhất 1 đề").max(20),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Set(v.examIds).size !== v.examIds.length) ctx.addIssue({ code: "custom", path: ["examIds"], message: "Đề bị trùng trong bộ đề" });
  });
export type CampaignInput = z.input<typeof campaignInputSchema>;

// ───────── pure ranking ─────────

export type FirstAttemptRow = { userId: string; examId: string; scoreScaled: number; finalizedAt: Date; correctCount: number };
export type Standing = {
  userId: string;
  completedCount: number;
  scoreSumScaled: number;
  scoreAverageScaled: number;
  correctCount: number;
  completedAt: Date;
  rank: number;
};

/**
 * Pure standings from first attempts. Only users who completed ALL N exams are ranked.
 * average = round_half_up(sum / N) in integer math. Order: average DESC, completedAt ASC
 * (time the whole set was completed = latest finalization), userId ASC (deterministic).
 */
export function computeStandings(rows: FirstAttemptRow[], examIds: string[]): { ranked: Standing[]; progress: Map<string, number> } {
  const N = examIds.length;
  const examSet = new Set(examIds);
  const byUser = new Map<string, Map<string, FirstAttemptRow>>();
  for (const r of rows) {
    if (!examSet.has(r.examId)) continue;
    const m = byUser.get(r.userId) ?? new Map<string, FirstAttemptRow>();
    if (!m.has(r.examId)) m.set(r.examId, r); // one first attempt per exam
    byUser.set(r.userId, m);
  }
  const progress = new Map<string, number>();
  const complete: Omit<Standing, "rank">[] = [];
  for (const [userId, m] of byUser) {
    progress.set(userId, m.size);
    if (m.size !== N) continue;
    const list = [...m.values()];
    const sum = list.reduce((s, r) => s + r.scoreScaled, 0);
    complete.push({
      userId,
      completedCount: N,
      scoreSumScaled: sum,
      scoreAverageScaled: Math.floor((2 * sum + N) / (2 * N)),
      correctCount: list.reduce((s, r) => s + r.correctCount, 0),
      completedAt: new Date(Math.max(...list.map((r) => r.finalizedAt.getTime()))),
    });
  }
  complete.sort(
    (a, b) =>
      b.scoreAverageScaled - a.scoreAverageScaled ||
      a.completedAt.getTime() - b.completedAt.getTime() ||
      (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
  );
  return { ranked: complete.map((s, i) => ({ ...s, rank: i + 1 })), progress };
}

// ───────── data access ─────────

type CampaignLean = NonNullable<Awaited<ReturnType<typeof loadCampaign>>>;

async function loadCampaign(id: string) {
  const c = await RankingCampaignModel.findById(parseObjectId(id, "Không tìm thấy kỳ xếp hạng.")).lean();
  if (!c) throw errors.notFound("Không tìm thấy kỳ xếp hạng.");
  return c;
}

/**
 * Eligible first attempts: rankEligible (first attempt by a STUDENT), started inside
 * [start, end), finalized (submitted or expired) strictly before end. Retakes never count.
 */
async function loadEligibleFirstAttempts(c: CampaignLean): Promise<FirstAttemptRow[]> {
  const rows = await AttemptModel.find(
    {
      examId: { $in: c.examIds },
      rankEligible: true,
      status: { $in: ["SUBMITTED", "EXPIRED", "FINALIZED"] },
      startedAt: { $gte: c.periodStartAt, $lt: c.periodEndAt },
      finalizedAt: { $lt: c.periodEndAt },
    },
    { userId: 1, examId: 1, scoreScaled: 1, finalizedAt: 1, gradeResult: 1 },
  ).lean();
  const userIds = [...new Set(rows.map((r) => String(r.userId)))];
  const active = await UserModel.find({ _id: { $in: userIds }, role: "STUDENT", status: "ACTIVE" }, { _id: 1 }).lean();
  const ok = new Set(active.map((u) => String(u._id)));
  return rows
    .filter((r) => ok.has(String(r.userId)))
    .map((r) => ({
      userId: String(r.userId),
      examId: String(r.examId),
      scoreScaled: r.scoreScaled ?? 0,
      finalizedAt: r.finalizedAt!,
      correctCount: (r.gradeResult as { correctCount?: number } | null)?.correctCount ?? 0,
    }));
}

export type LeaderboardEntry = { rank: number; displayName: string; scoreAverageScaled: number; completedAt: string; isMe: boolean };
export type LeaderboardDto = {
  campaign: {
    id: string;
    title: string;
    subjectId: string;
    subjectName: string;
    periodType: PeriodType;
    periodLabel: string;
    periodStartAt: string;
    periodEndAt: string;
    status: string;
    isLive: boolean;
    examCount: number;
    exams: { id: string; title: string }[];
  };
  entries: LeaderboardEntry[];
  totalRanked: number;
  me: { rank: number | null; completed: number; required: number; scoreAverageScaled: number | null; hidden: boolean } | null;
};

async function namesFor(userIds: string[]) {
  const users = await UserModel.find({ _id: { $in: userIds } }, { displayName: 1, leaderboardVisibility: 1 }).lean();
  return new Map(users.map((u) => [String(u._id), { name: u.displayName, isPublic: u.leaderboardVisibility !== "HIDDEN" }]));
}

/**
 * Leaderboard: CLOSED campaigns read the immutable snapshot; running campaigns are computed on
 * demand. Public entries show nickname only (or "Học sinh ẩn danh" when hidden); no emails/ids.
 */
export async function getLeaderboard(campaignId: string, opts: { limit: number; viewerId?: string | null }, now = new Date()): Promise<LeaderboardDto> {
  await connectToDatabase();
  const c = await loadCampaign(campaignId);
  if (c.status === "DRAFT" || c.status === "ARCHIVED") throw errors.notFound("Không tìm thấy kỳ xếp hạng.");
  const [subject, exams] = await Promise.all([
    SubjectModel.findById(c.subjectId, { name: 1 }).lean(),
    ExamModel.find({ _id: { $in: c.examIds } }, { title: 1 }).lean(),
  ]);
  const examTitle = new Map(exams.map((e) => [String(e._id), e.title]));
  const campaign = {
    id: String(c._id),
    title: c.title,
    subjectId: String(c.subjectId),
    subjectName: subject?.name ?? "",
    periodType: c.periodType,
    periodLabel: periodLabel(c.periodType, c.periodStartAt, c.periodEndAt),
    periodStartAt: c.periodStartAt.toISOString(),
    periodEndAt: c.periodEndAt.toISOString(),
    status: c.status,
    isLive: c.status === "ACTIVE" && now < c.periodEndAt,
    examCount: c.examIds.length,
    exams: c.examIds.map((id) => ({ id: String(id), title: examTitle.get(String(id)) ?? "" })),
  };
  const viewerId = opts.viewerId ?? null;

  if (c.status === "CLOSED") {
    const [top, total, mine] = await Promise.all([
      RankingSnapshotModel.find({ campaignId: c._id }).sort({ rank: 1 }).limit(opts.limit).lean(),
      RankingSnapshotModel.countDocuments({ campaignId: c._id }),
      viewerId ? RankingSnapshotModel.findOne({ campaignId: c._id, userId: viewerId }).lean() : null,
    ]);
    let completed = mine ? mine.completedCount : 0;
    if (viewerId && !mine) {
      const rows = await loadEligibleFirstAttempts(c);
      completed = rows.filter((r) => r.userId === viewerId).length;
    }
    return {
      campaign,
      totalRanked: total,
      entries: top.map((e) => ({
        rank: e.rank,
        displayName: e.isPublic || String(e.userId) === viewerId ? e.displayNameSnapshot : ANONYMOUS_NAME,
        scoreAverageScaled: e.scoreAverageScaled,
        completedAt: e.completedAt.toISOString(),
        isMe: String(e.userId) === viewerId,
      })),
      me: viewerId ? { rank: mine?.rank ?? null, completed, required: c.examIds.length, scoreAverageScaled: mine?.scoreAverageScaled ?? null, hidden: mine ? !mine.isPublic : false } : null,
    };
  }

  const rows = await loadEligibleFirstAttempts(c);
  const { ranked, progress } = computeStandings(rows, c.examIds.map(String));
  const top = ranked.slice(0, opts.limit);
  const names = await namesFor([...top.map((s) => s.userId), ...(viewerId ? [viewerId] : [])]);
  const mine = viewerId ? ranked.find((s) => s.userId === viewerId) : undefined;
  return {
    campaign,
    totalRanked: ranked.length,
    entries: top.map((s) => {
      const n = names.get(s.userId);
      const isMe = s.userId === viewerId;
      return { rank: s.rank, displayName: n && (n.isPublic || isMe) ? n.name : ANONYMOUS_NAME, scoreAverageScaled: s.scoreAverageScaled, completedAt: s.completedAt.toISOString(), isMe };
    }),
    me: viewerId
      ? {
          rank: mine?.rank ?? null,
          completed: progress.get(viewerId) ?? 0,
          required: c.examIds.length,
          scoreAverageScaled: mine?.scoreAverageScaled ?? null,
          hidden: names.get(viewerId)?.isPublic === false,
        }
      : null,
  };
}

export type CampaignSummary = { id: string; title: string; subjectId: string; subjectName: string; periodType: PeriodType; periodLabel: string; status: string; isLive: boolean; periodStartAt: string; periodEndAt: string; examCount: number };

/** Public list of visible campaigns (ACTIVE or CLOSED) for a subject/period. */
export async function listVisibleCampaigns(filter: { subjectId?: string; periodType?: PeriodType }, now = new Date()): Promise<CampaignSummary[]> {
  await connectToDatabase();
  const q: Record<string, unknown> = { status: { $in: ["ACTIVE", "CLOSED"] }, periodStartAt: { $lte: now } };
  if (filter.subjectId) q.subjectId = new Types.ObjectId(parseObjectId(filter.subjectId));
  if (filter.periodType) q.periodType = filter.periodType;
  const rows = await RankingCampaignModel.find(q).sort({ periodStartAt: -1 }).limit(30).lean();
  const subjects = await SubjectModel.find({ _id: { $in: rows.map((r) => r.subjectId) } }, { name: 1 }).lean();
  const names = new Map(subjects.map((s) => [String(s._id), s.name]));
  return rows.map((c) => toSummary(c, names.get(String(c.subjectId)) ?? "", now));
}

function toSummary(c: CampaignLean, subjectName: string, now: Date): CampaignSummary {
  return {
    id: String(c._id),
    title: c.title,
    subjectId: String(c.subjectId),
    subjectName,
    periodType: c.periodType,
    periodLabel: periodLabel(c.periodType, c.periodStartAt, c.periodEndAt),
    status: c.status,
    isLive: c.status === "ACTIVE" && now >= c.periodStartAt && now < c.periodEndAt,
    periodStartAt: c.periodStartAt.toISOString(),
    periodEndAt: c.periodEndAt.toISOString(),
    examCount: c.examIds.length,
  };
}

/** Student dashboard: my progress in currently running campaigns. */
export async function getMyRankingProgress(actor: Actor, now = new Date()) {
  await connectToDatabase();
  const running = await RankingCampaignModel.find({ status: "ACTIVE", periodStartAt: { $lte: now }, periodEndAt: { $gt: now } }).limit(20).lean();
  const subjects = await SubjectModel.find({ _id: { $in: running.map((c) => c.subjectId) } }, { name: 1 }).lean();
  const names = new Map(subjects.map((s) => [String(s._id), s.name]));
  const out = [];
  for (const c of running) {
    const done = await AttemptModel.distinct("examId", {
      userId: new Types.ObjectId(actor.id),
      examId: { $in: c.examIds },
      rankEligible: true,
      status: { $in: ["SUBMITTED", "EXPIRED", "FINALIZED"] },
      startedAt: { $gte: c.periodStartAt, $lt: c.periodEndAt },
    });
    out.push({ ...toSummary(c, names.get(String(c.subjectId)) ?? "", now), completed: done.length, required: c.examIds.length, eligible: actor.role === "STUDENT" });
  }
  return out;
}

// ───────── admin ─────────

export async function adminListCampaigns(actor: Actor, now = new Date()) {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const rows = await RankingCampaignModel.find({}).sort({ periodStartAt: -1 }).limit(100).lean();
  const subjects = await SubjectModel.find({ _id: { $in: rows.map((r) => r.subjectId) } }, { name: 1 }).lean();
  const names = new Map(subjects.map((s) => [String(s._id), s.name]));
  return rows.map((c) => ({ ...toSummary(c, names.get(String(c.subjectId)) ?? "", now), canFinalize: c.status === "ACTIVE" && now >= c.periodEndAt }));
}

export async function createCampaign(actor: Actor, raw: CampaignInput, opts: { isDemo?: boolean } = {}) {
  assertRole(actor, ["ADMIN"]);
  const input = campaignInputSchema.parse(raw);
  await connectToDatabase();
  const { start, end } = periodBounds(input.periodType, new Date(input.referenceDate));
  const exams = await ExamModel.find({ _id: { $in: input.examIds } }, { subjectId: 1 }).lean();
  if (exams.length !== input.examIds.length) throw errors.unprocessable("Có đề không tồn tại.");
  if (exams.some((e) => String(e.subjectId) !== input.subjectId)) throw errors.unprocessable("Tất cả đề phải cùng môn với kỳ xếp hạng.");
  const doc = await RankingCampaignModel.create({
    title: input.title,
    subjectId: input.subjectId,
    periodType: input.periodType,
    periodStartAt: start,
    periodEndAt: end,
    examIds: input.examIds,
    status: "DRAFT",
    createdBy: actor.id,
    isDemo: Boolean(opts.isDemo),
  });
  await writeAudit({ actorId: actor.id, action: "CAMPAIGN_CREATED", entityType: "RankingCampaign", entityId: doc._id });
  return { id: String(doc._id), periodStartAt: start.toISOString(), periodEndAt: end.toISOString() };
}

export type ActivationCheck = { ok: boolean; problems: string[]; warnings: string[] };

/** Fairness checks before activation (spec §5.11, §7.1). */
export async function checkCampaignActivation(c: CampaignLean, now = new Date()): Promise<ActivationCheck> {
  const problems: string[] = [];
  const warnings: string[] = [];
  if (!c.examIds.length) problems.push("Bộ đề đang trống.");
  if (c.periodEndAt <= c.periodStartAt) problems.push("Thời gian kỳ không hợp lệ.");
  if (c.periodEndAt <= now) problems.push("Kỳ đã kết thúc, không thể kích hoạt.");
  const exams = await ExamModel.find({ _id: { $in: c.examIds } }, { title: 1, publishStatus: 1, subjectId: 1, resultsReleasedAt: 1 }).lean();
  for (const e of exams) {
    if (e.publishStatus !== "PUBLISHED") problems.push(`Đề "${e.title}" chưa được xuất bản.`);
    if (String(e.subjectId) !== String(c.subjectId)) problems.push(`Đề "${e.title}" không cùng môn.`);
    if (e.resultsReleasedAt) problems.push(`Đề "${e.title}" đã công bố đáp án.`);
  }
  if (exams.length !== c.examIds.length) problems.push("Có đề không còn tồn tại.");
  const prior = await AttemptModel.aggregate<{ _id: Types.ObjectId }>([
    { $match: { examId: { $in: c.examIds }, userRole: "STUDENT", startedAt: { $lt: c.periodStartAt } } },
    { $group: { _id: "$examId" } },
  ]);
  for (const p of prior) {
    const t = exams.find((e) => String(e._id) === String(p._id))?.title ?? String(p._id);
    problems.push(`Đề "${t}" đã có học sinh làm trước kỳ — hãy dùng một đề riêng (có thể nhân bản đề) để đảm bảo công bằng.`);
  }
  const overlapping = await RankingCampaignModel.find(
    { _id: { $ne: c._id }, examIds: { $in: c.examIds }, status: { $in: ["ACTIVE", "CLOSED"] } },
    { title: 1, periodStartAt: 1, periodEndAt: 1, status: 1 },
  ).lean();
  for (const o of overlapping) {
    const overlaps = o.periodStartAt < c.periodEndAt && c.periodStartAt < o.periodEndAt;
    if (overlaps && o.status === "ACTIVE") problems.push(`Đề đang được dùng trong kỳ "${o.title}" có thời gian chồng lấn.`);
    else warnings.push(`Đề đã từng được dùng trong kỳ "${o.title}".`);
  }
  if (c.periodStartAt > now) warnings.push("Kỳ chưa bắt đầu; bảng xếp hạng sẽ hiển thị khi kỳ bắt đầu.");
  return { ok: problems.length === 0, problems, warnings };
}

export async function adminGetCampaign(actor: Actor, id: string, now = new Date()) {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const c = await loadCampaign(id);
  const [subject, exams, check] = await Promise.all([
    SubjectModel.findById(c.subjectId, { name: 1 }).lean(),
    ExamModel.find({ _id: { $in: c.examIds } }, { title: 1, publishStatus: 1 }).lean(),
    c.status === "DRAFT" ? checkCampaignActivation(c, now) : Promise.resolve(null),
  ]);
  const rows = c.status === "DRAFT" ? [] : await loadEligibleFirstAttempts(c);
  const { ranked, progress } = computeStandings(rows, c.examIds.map(String));
  const completeness = { ranked: ranked.length, partial: [...progress.values()].filter((n) => n < c.examIds.length).length };
  return {
    ...toSummary(c, subject?.name ?? "", now),
    exams: c.examIds.map((eid) => {
      const e = exams.find((x) => String(x._id) === String(eid));
      return { id: String(eid), title: e?.title ?? "(đã xóa)", publishStatus: e?.publishStatus ?? "ARCHIVED" };
    }),
    activation: check,
    completeness,
    finalizedAt: c.finalizedAt ? c.finalizedAt.toISOString() : null,
    canFinalize: c.status === "ACTIVE" && now >= c.periodEndAt,
  };
}

export async function activateCampaign(actor: Actor, id: string, now = new Date()) {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const c = await loadCampaign(id);
  if (c.status !== "DRAFT") throw errors.unprocessable("Chỉ kích hoạt được kỳ ở trạng thái nháp.");
  const check = await checkCampaignActivation(c, now);
  if (!check.ok) throw errors.unprocessable("Kỳ xếp hạng chưa đủ điều kiện kích hoạt.", { problems: check.problems });
  const r = await RankingCampaignModel.updateOne({ _id: c._id, status: "DRAFT" }, { $set: { status: "ACTIVE", activatedAt: now } });
  if (r.matchedCount !== 1) throw errors.conflict("Kỳ vừa được thay đổi.");
  await writeAudit({ actorId: actor.id, action: "CAMPAIGN_ACTIVATED", entityType: "RankingCampaign", entityId: c._id, metadata: { warnings: check.warnings.length } });
  return check;
}

/**
 * Finalize after the period ends: reconcile expired attempts in small batches (call again while
 * `done=false`), then write an immutable snapshot and close the campaign. Idempotent.
 */
export async function finalizeCampaign(actor: Actor, id: string, now = new Date()): Promise<{ done: boolean; remaining: number; ranked?: number }> {
  assertRole(actor, ["ADMIN"]);
  await connectToDatabase();
  const c = await loadCampaign(id);
  if (c.status === "CLOSED") return { done: true, remaining: 0, ranked: await RankingSnapshotModel.countDocuments({ campaignId: c._id }) };
  if (c.status !== "ACTIVE") throw errors.unprocessable("Chỉ chốt được kỳ đang hoạt động.");
  if (now < c.periodEndAt) throw errors.unprocessable("Kỳ chưa kết thúc, chưa thể chốt.");

  const rec = await reconcileExpiredAttempts({ examIds: c.examIds, limit: 100 }, now);
  if (rec.processed) await writeAudit({ actorId: actor.id, action: "ATTEMPTS_RECONCILED", entityType: "RankingCampaign", entityId: c._id, metadata: { processed: rec.processed } });
  if (rec.remaining > 0) return { done: false, remaining: rec.remaining };

  const rows = await loadEligibleFirstAttempts(c);
  const { ranked } = computeStandings(rows, c.examIds.map(String));
  const names = await namesFor(ranked.map((r) => r.userId));
  await mongoose.connection.transaction(async (session) => {
    const lock = await RankingCampaignModel.updateOne({ _id: c._id, status: "ACTIVE" }, { $set: { status: "CLOSED", finalizedAt: now, calculationVersion: CALCULATION_VERSION } }, { session });
    if (lock.matchedCount !== 1) throw errors.conflict("Kỳ đã được chốt bởi thao tác khác.");
    await RankingSnapshotModel.deleteMany({ campaignId: c._id }, { session });
    if (ranked.length) {
      await RankingSnapshotModel.insertMany(
        ranked.map((s) => ({
          campaignId: c._id,
          subjectId: c.subjectId,
          periodType: c.periodType,
          generatedAt: now,
          isFinal: true,
          calculationVersion: CALCULATION_VERSION,
          userId: new Types.ObjectId(s.userId),
          displayNameSnapshot: names.get(s.userId)?.name ?? ANONYMOUS_NAME,
          isPublic: names.get(s.userId)?.isPublic ?? false,
          scoreAverageScaled: s.scoreAverageScaled,
          scoreSumScaled: s.scoreSumScaled,
          completedCount: s.completedCount,
          correctCount: s.correctCount,
          completedAt: s.completedAt,
          rank: s.rank,
        })),
        { session },
      );
    }
  });
  await writeAudit({ actorId: actor.id, action: "CAMPAIGN_FINALIZED", entityType: "RankingCampaign", entityId: c._id, metadata: { ranked: ranked.length } });
  return { done: true, remaining: 0, ranked: ranked.length };
}

/** Reference helper for the admin UI: preview bounds for a period type/date. */
export function previewPeriod(periodType: PeriodType, referenceDate: Date) {
  const { start, end } = periodBounds(periodType, referenceDate);
  return { periodStartAt: start.toISOString(), periodEndAt: end.toISOString(), label: periodLabel(periodType, start, end) };
}
