import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearDb, setTestEnv, startTestDb, stopTestDb, syncAllIndexes } from "../helpers/db";
import { actorOf, createUser } from "../helpers/factories";
import { createSubjectFixture, scInput } from "../helpers/fixtures";
import { approvedQuestion, perfectAnswers, publishedExam, publishedRule } from "../helpers/exam-fixtures";
import { AppError } from "@/lib/errors";
import { periodBounds } from "@/lib/utils/period";
import { AttemptModel, UserExamProgressModel } from "@/modules/attempts/model";
import {
  finalizeAttempt,
  getAttemptForTaking,
  getAttemptResult,
  listMyAttempts,
  saveAnswers,
  startExamAttempt,
  startPracticeSession,
  submitAttempt,
} from "@/modules/attempts/service";
import { ExamModel, ScoringRuleModel } from "@/modules/exams/model";
import { approveExam, cloneExam, createExamDraft, getPublishedExamDetail, listPublishedExams, submitExamForReview, unpublishExam, updateExamDraft } from "@/modules/exams/service";
import { createQuestion } from "@/modules/questions/service";
import { QuestionKeyModel, QuestionModel, QuestionVersionModel } from "@/modules/questions/model";
import { RankingCampaignModel, RankingSnapshotModel } from "@/modules/rankings/model";
import { activateCampaign, createCampaign, finalizeCampaign, getLeaderboard } from "@/modules/rankings/service";
import { UserModel } from "@/modules/users/model";
import type { Actor } from "@/modules/users/permissions";
import { SubjectModel, TopicModel } from "@/modules/subjects/model";

async function expectAppError(p: Promise<unknown>, status: number, code?: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === status && (!code || e.code === code));
}

let admin: Actor, teacher: Actor, subjectId: string, ruleId: string;
let seq = 0;
const key = () => `k${Date.now()}x${seq++}abc`;

/** Start + answer every item according to `answer(type)` + submit. */
async function takeExam(actor: Actor, examId: string, answer: (type: string) => unknown, now = new Date()) {
  const { attemptId } = await startExamAttempt(actor, { examId, idempotencyKey: key() }, now);
  const view = await getAttemptForTaking(actor, attemptId, now);
  const answers: Record<string, unknown> = {};
  for (const it of view.items) answers[it.itemId] = answer(it.view.type);
  await saveAnswers(actor, attemptId, { revision: view.revision, answers }, now);
  return submitAttempt(actor, attemptId, now);
}
const perfect = (t: string) => perfectAnswers[t as keyof typeof perfectAnswers];
const wrong = (t: string) => (t === "SINGLE_CHOICE" ? { optionId: "A" } : t === "TRUE_FALSE" ? { values: { a: false, b: true, c: false, d: true } } : { text: "15" });

beforeAll(async () => {
  await startTestDb();
  void [AttemptModel, UserExamProgressModel, ExamModel, ScoringRuleModel, QuestionModel, QuestionVersionModel, QuestionKeyModel, RankingCampaignModel, RankingSnapshotModel, SubjectModel, TopicModel, UserModel];
  await syncAllIndexes();
});
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  setTestEnv({ NODE_ENV: "test" });
  admin = actorOf(await createUser({ username: "admin", role: "ADMIN" }));
  teacher = actorOf(await createUser({ username: "gv", role: "TEACHER" }));
  ({ subjectId } = await createSubjectFixture("toan"));
  ruleId = await publishedRule(admin, subjectId);
});

describe("exam builder & review", () => {
  it("only approved questions can be added; review → publish; published is immutable; clone makes a draft", async () => {
    const { id: draftQ } = await createQuestion(teacher, scInput(subjectId));
    const draftVersion = String((await QuestionModel.findById(draftQ).lean())!.latestVersionId);
    await expectAppError(
      createExamDraft(teacher, { title: "Đề thử", subjectId, examYear: 2026, mode: "MOCK", durationMinutes: 30, scoringRuleId: ruleId, items: [{ questionVersionId: draftVersion }] }),
      422,
    );
    const q = await approvedQuestion(teacher, admin, scInput(subjectId, [], "Câu đã duyệt"));
    const { id } = await createExamDraft(teacher, { title: "Đề thử", subjectId, examYear: 2026, mode: "MOCK", durationMinutes: 30, scoringRuleId: ruleId, items: [{ questionVersionId: q.versionId }] });
    await submitExamForReview(teacher, id);
    await expectAppError(approveExam(teacher, id), 403);
    await approveExam(admin, id);
    const e = await ExamModel.findById(id).lean();
    expect(e?.publishStatus).toBe("PUBLISHED");
    await expectAppError(
      updateExamDraft(teacher, id, { title: "Sửa", subjectId, examYear: 2026, mode: "MOCK", durationMinutes: 30, scoringRuleId: ruleId, items: [] }, e!.revision),
      422,
    );
    const clone = await cloneExam(teacher, id);
    expect((await ExamModel.findById(clone.id).lean())?.publishStatus).toBe("DRAFT");
  });

  it("empty exam cannot be submitted; public list/detail show only published metadata", async () => {
    const { id: empty } = await createExamDraft(teacher, { title: "Đề rỗng", subjectId, examYear: 2026, mode: "MOCK", durationMinutes: 30, scoringRuleId: ruleId, items: [] });
    await expectAppError(submitExamForReview(teacher, empty), 422);
    const pub = await publishedExam(teacher, admin, subjectId, ruleId);
    const list = await listPublishedExams({ page: 1, limit: 12 });
    expect(list.items.map((i) => i.id)).toEqual([pub]);
    const detail = await getPublishedExamDetail(pub);
    expect(detail?.questionCount).toBe(3);
    expect(JSON.stringify(detail)).not.toMatch(/correctOptionId|acceptedAnswers|stem|explanation/);
    expect(await getPublishedExamDetail(empty)).toBeNull();
    await unpublishExam(admin, pub);
    expect((await listPublishedExams({ page: 1, limit: 12 })).total).toBe(0);
  });
});

describe("attempt engine", () => {
  let student: Actor, examId: string;
  beforeEach(async () => {
    student = actorOf(await createUser({ username: "hs" }));
    examId = await publishedExam(teacher, admin, subjectId, ruleId);
  });

  it("cannot start unpublished exams (404) and the taking payload never contains answers", async () => {
    const { id: draft } = await createExamDraft(teacher, { title: "Nháp", subjectId, examYear: 2026, mode: "MOCK", durationMinutes: 10, scoringRuleId: ruleId, items: [] });
    await expectAppError(startExamAttempt(student, { examId: draft, idempotencyKey: key() }), 404);
    const { attemptId } = await startExamAttempt(student, { examId, idempotencyKey: key() });
    const view = await getAttemptForTaking(student, attemptId);
    expect(JSON.stringify(view)).not.toMatch(/correctOptionId|acceptedAnswers|"values":\{"a":(true|false)|explanation|questionVersionId|tolerance/);
    expect(view.items).toHaveLength(3);
    const other = actorOf(await createUser({ username: "hs_khac" }));
    await expectAppError(getAttemptForTaking(other, attemptId), 404);
  });

  it("concurrent starts produce exactly ONE first attempt; same idempotency key returns the same attempt", async () => {
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => startExamAttempt(student, { examId, idempotencyKey: key() })));
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await AttemptModel.countDocuments({ userId: student.id, examId, isFirstRankedAttempt: true })).toBe(1);
    expect(await UserExamProgressModel.countDocuments({ userId: student.id, examId })).toBe(1);

    const k = key();
    const same = await Promise.all([1, 2, 3].map(() => startExamAttempt(student, { examId: examId, idempotencyKey: k })));
    expect(new Set(same.map((s) => s.attemptId)).size).toBe(1);
  });

  it("autosave: revision conflict 409, foreign item 400, wrong type 422; server is source of truth", async () => {
    const { attemptId } = await startExamAttempt(student, { examId, idempotencyKey: key() });
    const v = await getAttemptForTaking(student, attemptId);
    const sc = v.items.find((i) => i.view.type === "SINGLE_CHOICE")!;
    const r1 = await saveAnswers(student, attemptId, { revision: v.revision, answers: { [sc.itemId]: { optionId: "A" } } });
    // Second tab still on old revision
    await expectAppError(saveAnswers(student, attemptId, { revision: v.revision, answers: { [sc.itemId]: { optionId: "C" } } }), 409, "REVISION_CONFLICT");
    await expectAppError(saveAnswers(student, attemptId, { revision: r1.revision, answers: { "507f1f77bcf86cd799439011": { optionId: "A" } } }), 400);
    await expectAppError(saveAnswers(student, attemptId, { revision: r1.revision, answers: { [sc.itemId]: { text: "x" } } }), 422);
    const after = await getAttemptForTaking(student, attemptId);
    expect(after.answers[sc.itemId]).toEqual({ optionId: "A" });
  });

  it("double submit → one result; no edits after submit; perfect answers = 10.000", async () => {
    const { attemptId } = await startExamAttempt(student, { examId, idempotencyKey: key() });
    const v = await getAttemptForTaking(student, attemptId);
    const answers = Object.fromEntries(v.items.map((i) => [i.itemId, perfect(i.view.type)]));
    await saveAnswers(student, attemptId, { revision: v.revision, answers });
    const [a, b] = await Promise.all([submitAttempt(student, attemptId), submitAttempt(student, attemptId)]);
    expect(a.scoreScaled).toBe(10_000);
    expect(b).toEqual(a);
    const doc = await AttemptModel.findById(attemptId).lean();
    expect(doc?.status).toBe("SUBMITTED");
    await expectAppError(saveAnswers(student, attemptId, { revision: doc!.revision, answers }), 409, "ATTEMPT_CLOSED");
  });

  it("expiry: server rejects edits after expiresAt and finalizes from saved answers", async () => {
    const t0 = new Date();
    const { attemptId } = await startExamAttempt(student, { examId, idempotencyKey: key() }, t0);
    const v = await getAttemptForTaking(student, attemptId, t0);
    const sc = v.items.find((i) => i.view.type === "SINGLE_CHOICE")!;
    await saveAnswers(student, attemptId, { revision: v.revision, answers: { [sc.itemId]: perfect("SINGLE_CHOICE") } }, t0);
    const late = new Date(t0.getTime() + 31 * 60_000);
    await expectAppError(saveAnswers(student, attemptId, { revision: v.revision + 1, answers: { [sc.itemId]: { optionId: "C" } } }, late), 409, "ATTEMPT_EXPIRED");
    const done = await AttemptModel.findById(attemptId).lean();
    expect(done?.status).toBe("EXPIRED");
    expect(done?.finalizedAt?.getTime()).toBe(done?.expiresAt?.getTime());
    // SC worth 0.25 of 1.75 → 1429
    expect(done?.scoreScaled).toBe(1429);
    // Resume 5 minutes in: remaining time derives from server expiresAt
    const { attemptId: second } = await startExamAttempt(student, { examId, idempotencyKey: key() }, late);
    const resumed = await getAttemptForTaking(student, second, new Date(late.getTime() + 5 * 60_000));
    expect(new Date(resumed.expiresAt!).getTime() - new Date(resumed.serverTime).getTime()).toBe(25 * 60_000);
  });

  it("retakes are unlimited but never become first; abandoned first attempt (0 điểm) stays first", async () => {
    const t0 = new Date();
    const { attemptId: first } = await startExamAttempt(student, { examId, idempotencyKey: key() }, t0);
    await finalizeAttempt(first, "RECONCILED", new Date(t0.getTime() + 60 * 60_000));
    const retake = await takeExam(student, examId, perfect);
    expect(retake.scoreScaled).toBe(10_000);
    const firstDoc = await AttemptModel.findById(first).lean();
    expect(firstDoc).toMatchObject({ isFirstRankedAttempt: true, scoreScaled: 0 });
    expect((await AttemptModel.findById(retake.attemptId).lean())?.isFirstRankedAttempt).toBe(false);
    const history = await listMyAttempts(student, { page: 1, limit: 20 });
    expect(history.total).toBe(2);
  });

  it("UNLIMITED_MODE (local testing): untimed attempts, no open-attempt cap; off again → timed", async () => {
    setTestEnv({ UNLIMITED_MODE: "true" });
    try {
      const ids = new Set<string>();
      for (let i = 0; i < 7; i++) ids.add((await startExamAttempt(student, { examId, idempotencyKey: key() })).attemptId);
      expect(ids.size).toBe(1); // resumes the same open attempt for the same exam
      const a = await AttemptModel.findOne({ userId: student.id, examId }).lean();
      expect(a?.expiresAt).toBeNull();
      // more than 5 open attempts across exams is allowed
      for (let i = 0; i < 6; i++) await startExamAttempt(student, { examId: await publishedExam(teacher, admin, subjectId, ruleId), idempotencyKey: key() });
      expect(await AttemptModel.countDocuments({ userId: student.id, status: "IN_PROGRESS" })).toBe(7);
    } finally {
      setTestEnv({ UNLIMITED_MODE: undefined });
    }
    const t = actorOf(await createUser({ username: "hs_timed" }));
    const { attemptId } = await startExamAttempt(t, { examId, idempotencyKey: key() });
    expect((await AttemptModel.findById(attemptId).lean())?.expiresAt).not.toBeNull();
  });

  it("teacher/admin attempts are never rank-eligible", async () => {
    const res = await takeExam(teacher, examId, perfect);
    expect((await AttemptModel.findById(res.attemptId).lean())?.rankEligible).toBe(false);
  });

  it("question edits after publishing do not change past attempts (version snapshot)", async () => {
    const res = await takeExam(student, examId, perfect);
    const before = await getAttemptResult(student, res.attemptId);
    const exam = await ExamModel.findById(examId).lean();
    const scQuestionId = exam!.items.find((i) => i.type === "SINGLE_CHOICE")!.questionId;
    const q = await QuestionModel.findById(scQuestionId).lean();
    const { updateQuestion } = await import("@/modules/questions/service");
    await updateQuestion(teacher, String(scQuestionId), scInput(subjectId, [], "Đề bài đã bị sửa", "D"), q!.revision);
    const after = await getAttemptResult(student, res.attemptId);
    expect(after.scoreScaled).toBe(before.scoreScaled);
    expect(after.items?.find((i) => i.view.type === "SINGLE_CHOICE")?.view.stem).toBe(before.items?.find((i) => i.view.type === "SINGLE_CHOICE")?.view.stem);
  });

  it("practice: reports the real number of questions; never ranked", async () => {
    const r = await startPracticeSession(student, { subjectId, count: 10, idempotencyKey: key() });
    expect(r.actual).toBe(3);
    expect(r.requested).toBe(10);
    const doc = await AttemptModel.findById(r.attemptId).lean();
    expect(doc).toMatchObject({ kind: "PRACTICE", rankEligible: false, expiresAt: null });
    const empty = await createSubjectFixture("ly");
    await expectAppError(startPracticeSession(student, { subjectId: empty.subjectId, count: 5, idempotencyKey: key() }), 422);
  });
});

describe("rankings (spec §7.4)", () => {
  it("full campaign lifecycle", async () => {
    const now = new Date();
    const { start, end } = periodBounds("WEEK", now);
    const e1 = await publishedExam(teacher, admin, subjectId, ruleId, { title: "Tuần - Đề 1" });
    const e2 = await publishedExam(teacher, admin, subjectId, ruleId, { title: "Tuần - Đề 2" });
    const other = await createSubjectFixture("ly");
    const otherRule = await publishedRule(admin, other.subjectId);
    const otherExam = await publishedExam(teacher, admin, other.subjectId, otherRule, { title: "Đề Vật lí" });

    const camp = await createCampaign(admin, { title: "Toán tuần này", subjectId, periodType: "WEEK", referenceDate: now.toISOString(), examIds: [e1, e2] });
    expect(camp.periodStartAt).toBe(start.toISOString());
    await expectAppError(createCampaign(admin, { title: "Sai môn", subjectId, periodType: "WEEK", referenceDate: now.toISOString(), examIds: [otherExam] }), 422);
    await activateCampaign(admin, camp.id, now);

    const A = actorOf(await createUser({ username: "an", displayName: "An" }));
    const B = actorOf(await createUser({ username: "binh", displayName: "Bình" }));
    const C = actorOf(await createUser({ username: "chi", displayName: "Chi" }));
    const H = actorOf(await createUser({ username: "hidden", displayName: "Tên Thật" }));
    await UserModel.updateOne({ _id: H.id }, { $set: { leaderboardVisibility: "HIDDEN" } });

    // A: 10 + 0 → avg 5.000 ; then retakes e2 perfectly (must not change rank)
    await takeExam(A, e1, perfect, now);
    await takeExam(A, e2, wrong, now);
    const retake = await takeExam(A, e2, perfect, now);
    expect(retake.scoreScaled).toBe(10_000);
    // B: only 1/2 → not ranked
    await takeExam(B, e1, perfect, now);
    // C: 10 + 10 → avg 10
    await takeExam(C, e1, perfect, now);
    await takeExam(C, e2, perfect, now);
    // H (hidden nickname): 0 + 0
    await takeExam(H, e1, wrong, now);
    await takeExam(H, e2, wrong, now);
    // teacher does everything perfectly → excluded
    await takeExam(teacher, e1, perfect, now);
    await takeExam(teacher, e2, perfect, now);
    // another subject's attempts do not leak in
    await takeExam(B, otherExam, perfect, now);

    const live = await getLeaderboard(camp.id, { limit: 10, viewerId: B.id }, now);
    expect(live.campaign.isLive).toBe(true);
    expect(live.entries.map((e) => [e.rank, e.displayName, e.scoreAverageScaled])).toEqual([
      [1, "Chi", 10000],
      [2, "An", 5000],
      [3, "Học sinh ẩn danh", 0],
    ]);
    expect(live.me).toMatchObject({ rank: null, completed: 1, required: 2 });
    expect(JSON.stringify(live)).not.toMatch(/@example\.com|Tên Thật/);
    const hiddenView = await getLeaderboard(camp.id, { limit: 10, viewerId: H.id }, now);
    expect(hiddenView.entries.find((e) => e.isMe)?.displayName).toBe("Tên Thật"); // user sees own name

    // Answers withheld while campaign runs (even after submit)
    const aAttempt = await AttemptModel.findOne({ userId: A.id, examId: e1 }).lean();
    const withheld = await getAttemptResult(A, String(aAttempt!._id), now);
    expect(withheld.released).toBe(false);
    expect(withheld.items).toBeNull();
    expect(JSON.stringify(withheld)).not.toMatch(/correctOptionId|acceptedAnswers|explanation/);

    // Cannot finalize before end; after end → immutable snapshot
    await expectAppError(finalizeCampaign(admin, camp.id, now), 422);
    // A late finisher: B starts e2 inside the period but submits after the end → not counted
    const { attemptId: lateId } = await startExamAttempt(B, { examId: e2, idempotencyKey: key() }, new Date(end.getTime() - 60_000));
    const afterEnd = new Date(end.getTime() + 60_000);
    await submitAttempt(B, lateId, afterEnd);
    const fin = await finalizeCampaign(admin, camp.id, afterEnd);
    expect(fin).toMatchObject({ done: true, ranked: 3 });
    const closed = await getLeaderboard(camp.id, { limit: 10, viewerId: null }, afterEnd);
    expect(closed.entries.map((e) => e.displayName)).toEqual(["Chi", "An", "Học sinh ẩn danh"]);

    // New data after closing never changes the snapshot
    await UserModel.updateOne({ _id: C.id }, { $set: { displayName: "Đổi Tên" } });
    await takeExam(B, e2, perfect, afterEnd);
    const again = await getLeaderboard(camp.id, { limit: 10, viewerId: null }, afterEnd);
    expect(again.entries).toEqual(closed.entries);
    expect(await finalizeCampaign(admin, camp.id, afterEnd)).toMatchObject({ done: true, ranked: 3 });

    // After the campaign ends, answers are released
    const released = await getAttemptResult(A, String(aAttempt!._id), afterEnd);
    expect(released.released).toBe(true);
    expect(released.items?.[0]?.key).toBeTruthy();
  });

  it("activation is refused for exams students already did before the period", async () => {
    const now = new Date();
    const e1 = await publishedExam(teacher, admin, subjectId, ruleId);
    const S = actorOf(await createUser({ username: "som" }));
    const lastWeek = new Date(now.getTime() - 8 * 24 * 3600_000);
    await takeExam(S, e1, perfect, lastWeek);
    const camp = await createCampaign(admin, { title: "Không công bằng", subjectId, periodType: "WEEK", referenceDate: now.toISOString(), examIds: [e1] });
    await expectAppError(activateCampaign(admin, camp.id, now), 422);
    expect((await RankingCampaignModel.findById(camp.id).lean())?.status).toBe("DRAFT");
  });
});
