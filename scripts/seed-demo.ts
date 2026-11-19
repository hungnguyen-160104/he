/**
 * pnpm seed:demo            — create DEMO data (idempotent; never modifies non-DEMO data)
 * pnpm seed:demo --profile e2e — synthetic fixtures used by the E2E suite
 * pnpm seed:demo --remove   — delete ALL DEMO data (+ attempts/progress on DEMO content)
 * Options: --dry-run (show what would happen), --yes (skip confirmation for non-local DB)
 *
 * Everything is flagged isDemo=true and labelled "DEMO". Questions are synthetic practice items,
 * NOT official exam content. Content goes through the real services (validation, versioning,
 * review/approval) using a dedicated DEMO teacher account with an unusable random password.
 */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { confirmDangerousTarget, loadLocalEnv } from "./lib/script-env";
import { DEMO_EXAMS } from "./demo-content/index";
import { topicSlug } from "./demo-content/builders";

loadLocalEnv();

type QType = "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
const ALL: QType[] = ["SINGLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"];
const SC_TF: QType[] = ["SINGLE_CHOICE", "TRUE_FALSE"];

const SUBJECTS: { name: string; slug: string; code: string; types: QType[]; topics: string[] }[] = [
  { name: "Toán", slug: "toan", code: "TOAN", types: ALL, topics: ["Hàm số và đồ thị", "Mũ và logarit", "Nguyên hàm – tích phân", "Hình học không gian", "Xác suất – thống kê"] },
  { name: "Vật lí", slug: "vat-li", code: "LY", types: ALL, topics: ["Vật lí nhiệt", "Khí lí tưởng", "Từ trường", "Vật lí hạt nhân"] },
  { name: "Hóa học", slug: "hoa-hoc", code: "HOA", types: ALL, topics: ["Este – lipit", "Cacbohiđrat", "Kim loại"] },
  { name: "Sinh học", slug: "sinh-hoc", code: "SINH", types: ALL, topics: ["Di truyền phân tử", "Tiến hóa", "Sinh thái học"] },
  { name: "Lịch sử", slug: "lich-su", code: "SU", types: SC_TF, topics: ["Lịch sử thế giới", "Lịch sử Việt Nam"] },
  { name: "Địa lí", slug: "dia-li", code: "DIA", types: ALL, topics: ["Địa lí tự nhiên", "Địa lí kinh tế"] },
  { name: "Giáo dục kinh tế và pháp luật", slug: "gdktpl", code: "GDKTPL", types: SC_TF, topics: ["Kinh tế", "Pháp luật"] },
  { name: "Tin học", slug: "tin-hoc", code: "TIN", types: SC_TF, topics: ["Mạng máy tính", "Lập trình"] },
  { name: "Công nghệ Công nghiệp", slug: "cong-nghe-cong-nghiep", code: "CNCN", types: SC_TF, topics: ["Kĩ thuật điện", "Kĩ thuật điện tử"] },
  { name: "Công nghệ Nông nghiệp", slug: "cong-nghe-nong-nghiep", code: "CNNN", types: SC_TF, topics: ["Trồng trọt", "Chăn nuôi"] },
  { name: "Tiếng Anh", slug: "tieng-anh", code: "ANH", types: ["SINGLE_CHOICE"], topics: ["Ngữ pháp", "Từ vựng", "Đọc hiểu"] },
];

const SECTIONS = [
  { id: "I", title: "Phần I — Trắc nghiệm nhiều lựa chọn", questionType: "SINGLE_CHOICE" as const },
  { id: "II", title: "Phần II — Trắc nghiệm đúng/sai", questionType: "TRUE_FALSE" as const },
  { id: "III", title: "Phần III — Trả lời ngắn", questionType: "SHORT_ANSWER" as const },
];
const TYPE_RULES = {
  SINGLE_CHOICE: { points: "0.25" },
  TRUE_FALSE: { pointsByCorrectCount: ["0", "0.1", "0.25", "0.5", "1"] as [string, string, string, string, string] },
  SHORT_ANSWER: { points: "0.5" },
};

// ───────── synthetic content generators (deterministic, mathematically correct) ─────────
type Body =
  | { type: "SINGLE_CHOICE"; content: { stem: string; options: { id: "A" | "B" | "C" | "D"; text: string }[]; media: [] }; key: { correctOptionId: "A" | "B" | "C" | "D" }; explanation: string }
  | { type: "TRUE_FALSE"; content: { stem: string; statements: { id: "a" | "b" | "c" | "d"; text: string }[]; media: [] }; key: { values: { a: boolean; b: boolean; c: boolean; d: boolean } }; explanation: string }
  | { type: "SHORT_ANSWER"; content: { stem: string; media: [] }; key: { answerType: "NUMBER" | "TEXT"; acceptedAnswers: string[]; tolerance: null; caseSensitive: boolean }; explanation: string };

const IDS = ["A", "B", "C", "D"] as const;
function sc(stem: string, correct: string, wrong: [string, string, string], pos: number, explanation: string): Body {
  const opts = [...wrong];
  opts.splice(pos % 4, 0, correct);
  return { type: "SINGLE_CHOICE", content: { stem: `[DEMO] ${stem}`, options: IDS.map((id, i) => ({ id, text: opts[i]! })), media: [] }, key: { correctOptionId: IDS[pos % 4]! }, explanation };
}
function tf(stem: string, st: [string, boolean][], explanation: string): Body {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    type: "TRUE_FALSE",
    content: { stem: `[DEMO] ${stem}`, statements: ids.map((id, i) => ({ id, text: st[i]![0] })), media: [] },
    key: { values: { a: st[0]![1], b: st[1]![1], c: st[2]![1], d: st[3]![1] } },
    explanation,
  };
}
function sa(stem: string, accepted: string[], explanation: string, answerType: "NUMBER" | "TEXT" = "NUMBER"): Body {
  return { type: "SHORT_ANSWER", content: { stem: `[DEMO] ${stem}`, media: [] }, key: { answerType, acceptedAnswers: accepted, tolerance: null, caseSensitive: false }, explanation };
}

function mathQuestions(): { topic: number; difficulty: "EASY" | "MEDIUM" | "HARD"; body: Body }[] {
  const out: { topic: number; difficulty: "EASY" | "MEDIUM" | "HARD"; body: Body }[] = [];
  for (let k = 1; k <= 14; k++) {
    const a = k + 1;
    const n = (k % 3) + 2;
    // derivative of a x^n at x=1 → a*n
    out.push({ topic: 0, difficulty: "EASY", body: sc(`Cho hàm số $f(x) = ${a}x^{${n}}$. Giá trị $f'(1)$ bằng`, `$${a * n}$`, [`$${a}$`, `$${a * n + 1}$`, `$${a * n + 2}$`], k, `$f'(x) = ${a * n}x^{${n - 1}}$ nên $f'(1) = ${a * n}$.`) });
    // log2(2^k)
    const m = (k % 6) + 1;
    out.push({ topic: 1, difficulty: "EASY", body: sc(`Giá trị của $\\log_2 ${2 ** m}$ bằng`, `$${m}$`, [`$${m + 1}$`, `$${m + 2}$`, `$${m + 3}$`], k + 1, `$2^{${m}} = ${2 ** m}$ nên $\\log_2 ${2 ** m} = ${m}$.`) });
  }
  for (let k = 1; k <= 8; k++) {
    const p = k;
    const q = k + 2;
    out.push({
      topic: 0,
      difficulty: "MEDIUM",
      body: tf(
        `Cho hàm số $f(x) = x^2 - ${p + q}x + ${p * q}$.`,
        [
          [`Phương trình $f(x)=0$ có hai nghiệm $x=${p}$ và $x=${q}$.`, true],
          [`Đồ thị hàm số cắt trục tung tại điểm có tung độ bằng $${p + q}$.`, false],
          [`Hàm số đạt giá trị nhỏ nhất tại $x = ${(p + q) / 2}$.`, true],
          [`$f(0) < 0$.`, false],
        ],
        `$f(x) = (x-${p})(x-${q})$; $f(0) = ${p * q} > 0$; đỉnh tại $x = \\frac{${p + q}}{2}$.`,
      ),
    });
  }
  for (let k = 1; k <= 8; k++) {
    // ∫_0^k 2x dx = k^2
    out.push({ topic: 2, difficulty: "MEDIUM", body: sa(`Tính tích phân $I = \\int_0^{${k}} 2x\\,dx$.`, [String(k * k)], `$I = x^2\\big|_0^{${k}} = ${k * k}$.`) });
    // 2x + 1 = 2k+4 → x = k + 1.5 → decimal answer with comma
    const x = k + 1.5;
    out.push({ topic: 4, difficulty: "HARD", body: sa(`Giải phương trình $2x + 1 = ${2 * x + 1}$. Nhập giá trị của $x$ (dạng số thập phân).`, [String(x).replace(".", ",")], `$x = \\frac{${2 * x + 1} - 1}{2} = ${String(x).replace(".", ",")}$.`) });
  }
  return out;
}

function genericQuestions(subjectName: string, types: QType[]): { topic: number; difficulty: "EASY" | "MEDIUM" | "HARD"; body: Body }[] {
  const out: { topic: number; difficulty: "EASY" | "MEDIUM" | "HARD"; body: Body }[] = [];
  if (subjectName === "Tiếng Anh") {
    const items: [string, string, [string, string, string]][] = [
      ["She ___ to school every day.", "goes", ["go", "going", "gone"]],
      ["If I ___ rich, I would travel the world.", "were", ["am", "be", "will be"]],
      ["They have lived here ___ 2015.", "since", ["for", "from", "at"]],
      ["The book ___ by millions of people.", "has been read", ["has read", "reads", "is reading"]],
      ["He is interested ___ music.", "in", ["on", "at", "with"]],
      ["Choose the synonym of 'big'.", "large", ["tiny", "narrow", "short"]],
      ["I look forward to ___ you.", "seeing", ["see", "saw", "seen"]],
      ["The opposite of 'ancient' is ___.", "modern", ["old", "historic", "antique"]],
    ];
    items.forEach(([stem, c, w], i) => out.push({ topic: i % 3, difficulty: i < 4 ? "EASY" : "MEDIUM", body: sc(stem, c, w, i, `Đáp án đúng: "${c}".`) }));
    return out;
  }
  for (let i = 1; i <= 6; i++) {
    out.push({ topic: i % 2, difficulty: "EASY", body: sc(`Câu hỏi luyện tập ${subjectName} số ${i}: chọn số lớn nhất.`, `$${i + 10}$`, [`$${i}$`, `$${i + 1}$`, `$${i + 2}$`], i, "Câu hỏi DEMO minh họa giao diện, không phải nội dung chính thức.") });
  }
  if (types.includes("TRUE_FALSE")) {
    for (let i = 1; i <= 3; i++) {
      out.push({
        topic: 0,
        difficulty: "MEDIUM",
        body: tf(`Câu đúng/sai DEMO môn ${subjectName} số ${i}. Xét các phát biểu về số tự nhiên $n = ${i * 4}$.`, [
          [`$n$ là số chẵn.`, true],
          [`$n$ chia hết cho 3.`, (i * 4) % 3 === 0],
          [`$n > 100$.`, false],
          [`$n$ chia hết cho 4.`, true],
        ], "Câu hỏi DEMO."),
      });
    }
  }
  if (types.includes("SHORT_ANSWER")) {
    for (let i = 1; i <= 2; i++) out.push({ topic: 1, difficulty: "MEDIUM", body: sa(`Câu trả lời ngắn DEMO môn ${subjectName}: tính $${i} + 0,5$.`, [`${i},5`], "Câu hỏi DEMO.") });
  }
  return out;
}

async function main() {
  const { values } = parseArgs({
    options: {
      remove: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      yes: { type: "boolean", default: false },
      // thpt (default): one full exam per subject in the 2025 format. e2e: synthetic fixtures for automated tests.
      profile: { type: "string", default: "thpt" },
    },
  });
  const profile = values.profile === "e2e" ? "e2e" : "thpt";
  const dryRun = values["dry-run"];

  const mongoose = (await import("mongoose")).default;
  const { resetEnvCache } = await import("@/lib/env");
  const { connectToDatabase, disconnectFromDatabase } = await import("@/lib/mongodb/connection");
  const { UserModel } = await import("@/modules/users/model");
  const { SubjectModel, TopicModel } = await import("@/modules/subjects/model");
  const { QuestionModel, QuestionVersionModel, QuestionKeyModel } = await import("@/modules/questions/model");
  const { ExamModel, ScoringRuleModel } = await import("@/modules/exams/model");
  const { AttemptModel, UserExamProgressModel } = await import("@/modules/attempts/model");
  const { RankingCampaignModel, RankingSnapshotModel } = await import("@/modules/rankings/model");
  const { writeAudit, AuditLogModel } = await import("@/modules/audit/service");
  const { hashPassword } = await import("@/modules/auth/password");
  resetEnvCache();
  if (!process.env.MONGODB_URI) {
    console.error("Thiếu MONGODB_URI (đặt trong .env.local hoặc biến môi trường).");
    process.exit(1);
  }

  await confirmDangerousTarget(values.remove ? "XÓA toàn bộ dữ liệu DEMO" : "tạo dữ liệu DEMO", values.yes || dryRun);
  await connectToDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

  // ───────── remove ─────────
  if (values.remove) {
    const demoExams = (await ExamModel.find({ isDemo: true }, { _id: 1 }).lean()).map((e) => e._id);
    const demoQuestions = (await QuestionModel.find({ isDemo: true }, { _id: 1 }).lean()).map((q) => q._id);
    const demoVersions = (await QuestionVersionModel.find({ questionId: { $in: demoQuestions } }, { _id: 1 }).lean()).map((v) => v._id);
    const demoCampaigns = (await RankingCampaignModel.find({ isDemo: true }, { _id: 1 }).lean()).map((c) => c._id);
    const attemptFilter = { $or: [{ examId: { $in: demoExams } }, { "items.questionId": { $in: demoQuestions } }] };
    const plan = {
      campaigns: demoCampaigns.length,
      snapshots: await RankingSnapshotModel.countDocuments({ campaignId: { $in: demoCampaigns } }),
      attempts: await AttemptModel.countDocuments(attemptFilter),
      progress: await UserExamProgressModel.countDocuments({ examId: { $in: demoExams } }),
      exams: demoExams.length,
      questions: demoQuestions.length,
      versions: demoVersions.length,
      scoringRules: await ScoringRuleModel.countDocuments({ isDemo: true }),
      topics: await TopicModel.countDocuments({ isDemo: true }),
      subjects: await SubjectModel.countDocuments({ isDemo: true }),
      demoUsers: await UserModel.countDocuments({ isDemo: true }),
    };
    console.log("Sẽ xóa:", plan);
    if (dryRun) return void (await disconnectFromDatabase());
    // A non-DEMO exam/question that references DEMO subjects/rules keeps those subjects/rules.
    const realExamRules = await ExamModel.distinct("scoringRuleId", { isDemo: { $ne: true } });
    const realSubjectRefs = new Set([
      ...(await ExamModel.distinct("subjectId", { isDemo: { $ne: true } })).map(String),
      ...(await QuestionModel.distinct("subjectId", { isDemo: { $ne: true } })).map(String),
    ]);
    await RankingSnapshotModel.deleteMany({ campaignId: { $in: demoCampaigns } });
    await RankingCampaignModel.deleteMany({ _id: { $in: demoCampaigns } });
    await AttemptModel.deleteMany(attemptFilter);
    await UserExamProgressModel.deleteMany({ examId: { $in: demoExams } });
    await ExamModel.deleteMany({ _id: { $in: demoExams } });
    await QuestionKeyModel.deleteMany({ questionVersionId: { $in: demoVersions } });
    await QuestionVersionModel.deleteMany({ _id: { $in: demoVersions } });
    await QuestionModel.deleteMany({ _id: { $in: demoQuestions } });
    await ScoringRuleModel.deleteMany({ isDemo: true, _id: { $nin: realExamRules } });
    const keepSubjects = (await SubjectModel.find({ isDemo: true }, { _id: 1 }).lean()).filter((s) => realSubjectRefs.has(String(s._id))).map((s) => s._id);
    await TopicModel.deleteMany({ isDemo: true, subjectId: { $nin: keepSubjects } });
    await SubjectModel.deleteMany({ isDemo: true, _id: { $nin: keepSubjects } });
    const demoUserIds = (await UserModel.find({ isDemo: true }, { _id: 1 }).lean()).map((u) => u._id);
    await AuditLogModel.deleteMany({ actorId: { $in: demoUserIds } });
    await UserModel.deleteMany({ isDemo: true });
    await writeAudit({ actorId: null, action: "DEMO_REMOVED", entityType: "System", metadata: plan });
    console.log("Đã xóa dữ liệu DEMO.", keepSubjects.length ? `(Giữ lại ${keepSubjects.length} môn DEMO vì đang có dữ liệu thật tham chiếu.)` : "");
    await disconnectFromDatabase();
    return;
  }

  // ───────── create ─────────
  if (dryRun) {
    console.log(profile === "thpt"
      ? `Sẽ tạo/cập nhật: ${SUBJECTS.length} môn DEMO + chủ đề + quy tắc tính điểm, và ${DEMO_EXAMS.length} đề thi thử (${DEMO_EXAMS.map((e) => e.subjectName).join(", ")}) kèm lời giải (nếu chưa có).`
      : `Sẽ tạo/cập nhật: ${SUBJECTS.length} môn DEMO, câu hỏi tổng hợp, 6 đề và 1 kỳ xếp hạng tuần (hồ sơ e2e).`);
    return void (await disconnectFromDatabase());
  }
  const { createQuestion, requestQuestionReview, approveQuestion } = await import("@/modules/questions/service");
  const { createScoringRule, publishScoringRule } = await import("@/modules/exams/scoring-service");
  const { createExamDraft, submitExamForReview, approveExam } = await import("@/modules/exams/service");
  const { createCampaign, activateCampaign } = await import("@/modules/rankings/service");

  // DEMO content owner: unusable random password, never printed.
  let teacher = await UserModel.findOne({ usernameNormalized: "demo_giaovien" }).lean();
  if (!teacher) {
    const doc = await UserModel.create({
      username: "demo_giaovien",
      usernameNormalized: "demo_giaovien",
      email: "demo_giaovien@demo.invalid",
      emailNormalized: "demo_giaovien@demo.invalid",
      passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
      role: "TEACHER",
      status: "ACTIVE",
      displayName: "Giáo viên DEMO",
      isDemo: true,
    });
    teacher = doc.toObject();
  } else if (!teacher.isDemo) {
    console.error('Đã có tài khoản "demo_giaovien" không phải DEMO — dừng để tránh động vào dữ liệu thật.');
    process.exit(1);
  }
  const teacherActor = { id: String(teacher._id), role: "TEACHER" as const, displayName: "Giáo viên DEMO", mustChangePassword: false };
  // Approvals are performed by a seed actor attributed to the DEMO account (clearly DEMO in audit logs).
  const seedAdmin = { ...teacherActor, role: "ADMIN" as const, displayName: "DEMO seed" };

  const subjectIds: Record<string, string> = {};
  const topicIds: Record<string, string[]> = {};
  for (const [i, s] of SUBJECTS.entries()) {
    let subj = await SubjectModel.findOne({ slug: s.slug }).lean();
    if (!subj) {
      const created = await SubjectModel.create({ name: s.name, slug: s.slug, code: s.code, allowedQuestionTypes: s.types, isActive: true, sortOrder: i, examYearsSupported: [2025, 2026], isDemo: true });
      subj = created.toObject();
    } else if (!subj.isDemo) {
      console.log(`Bỏ qua môn "${s.slug}" vì đã tồn tại dữ liệu thật.`);
    }
    subjectIds[s.slug] = String(subj._id);
    topicIds[s.slug] = [];
    const thpt = DEMO_EXAMS.find((e) => e.slug === s.slug);
    const topicNames = profile === "thpt" && thpt ? thpt.topics : s.topics;
    for (const [j, name] of topicNames.entries()) {
      const slug = topicSlug(name);
      let t = await TopicModel.findOne({ subjectId: subj._id, parentId: null, slug }).lean();
      if (!t && subj.isDemo) t = (await TopicModel.create({ subjectId: subj._id, name, slug, sortOrder: j, isDemo: true })).toObject();
      if (t) topicIds[s.slug]!.push(String(t._id));
    }
    if (subj.isDemo && !(await ScoringRuleModel.exists({ subjectId: subj._id, isDemo: true }))) {
      // Part III points differ per subject in the 2025 format (Toán 0,5; other subjects with part III 0,25).
      const typeRules = { ...TYPE_RULES, SHORT_ANSWER: { points: thpt?.shortAnswerPoints ?? TYPE_RULES.SHORT_ANSWER.points } };
      const rule = await createScoringRule(seedAdmin, { name: `Mô phỏng cấu trúc đề tốt nghiệp THPT từ 2025 — ${s.name} (DEMO, cần đối chiếu văn bản chính thức)`, subjectId: String(subj._id), examYear: 2026, sections: SECTIONS.filter((x) => s.types.includes(x.questionType)), typeRules }, { isDemo: true });
      await publishScoringRule(seedAdmin, rule.id);
    }
  }
  console.log(`✓ ${SUBJECTS.length} môn + chủ đề + quy tắc tính điểm DEMO`);

  if (await QuestionModel.exists({ isDemo: true })) {
    console.log("Đã có câu hỏi/đề DEMO — bỏ qua bước tạo nội dung (seed idempotent). Dùng --remove rồi chạy lại để tạo mới.");
    await disconnectFromDatabase();
    return;
  }

  if (profile === "thpt") {
    let total = 0;
    for (const exam of DEMO_EXAMS) {
      const subjectId = subjectIds[exam.slug];
      if (!subjectId || !(await SubjectModel.exists({ _id: subjectId, isDemo: true }))) {
        console.log(`Bỏ qua đề ${exam.subjectName}: môn không phải DEMO.`);
        continue;
      }
      const versionIds: string[] = [];
      for (const q of exam.questions) {
        const topic = topicIds[exam.slug]![q.topic];
        const { id } = await createQuestion(teacherActor, { meta: { subjectId, topicIds: topic ? [topic] : [], difficulty: q.difficulty, tags: ["demo", `phan-${q.part.toLowerCase()}`] }, body: q.body }, { isDemo: true });
        await requestQuestionReview(teacherActor, id);
        await approveQuestion(seedAdmin, id);
        versionIds.push(String((await QuestionModel.findById(id, { publishedVersionId: 1 }).lean())!.publishedVersionId));
      }
      const rule = await ScoringRuleModel.findOne({ subjectId, isDemo: true, status: "PUBLISHED" }).lean();
      const { id } = await createExamDraft(
        teacherActor,
        { title: exam.title, description: exam.description, subjectId, examYear: 2026, mode: "MOCK", durationMinutes: exam.durationMinutes, scoringRuleId: String(rule!._id), resultReleasePolicy: "AFTER_SUBMISSION", items: versionIds.map((v) => ({ questionVersionId: v })) },
        { isDemo: true },
      );
      await submitExamForReview(teacherActor, id);
      await approveExam(seedAdmin, id);
      total += exam.questions.length;
      console.log(`✓ ${exam.title}: ${exam.questions.length} câu, ${exam.durationMinutes} phút`);
    }
    await writeAudit({ actorId: null, action: "DEMO_SEEDED", entityType: "System", metadata: { profile, questions: total } });
    console.log("Hoàn tất. Gỡ dữ liệu DEMO bất kỳ lúc nào bằng: pnpm seed:demo --remove");
    await disconnectFromDatabase();
    return;
  }

  const versionsBySubject: Record<string, { versionId: string; type: QType }[]> = {};
  for (const s of SUBJECTS) {
    if (!(await SubjectModel.exists({ _id: subjectIds[s.slug], isDemo: true }))) continue;
    const list = s.slug === "toan" ? mathQuestions() : genericQuestions(s.name, s.types);
    versionsBySubject[s.slug] = [];
    for (const q of list) {
      const topic = topicIds[s.slug]![q.topic % topicIds[s.slug]!.length];
      const { id } = await createQuestion(teacherActor, { meta: { subjectId: subjectIds[s.slug]!, topicIds: topic ? [topic] : [], difficulty: q.difficulty, tags: ["demo"] }, body: q.body }, { isDemo: true });
      await requestQuestionReview(teacherActor, id);
      await approveQuestion(seedAdmin, id);
      const doc = await QuestionModel.findById(id, { publishedVersionId: 1 }).lean();
      versionsBySubject[s.slug]!.push({ versionId: String(doc!.publishedVersionId), type: q.body.type });
    }
  }
  console.log(`✓ ${Object.values(versionsBySubject).reduce((a, b) => a + b.length, 0)} câu hỏi DEMO đã duyệt`);

  const ruleOf = async (slug: string) => String((await ScoringRuleModel.findOne({ subjectId: subjectIds[slug], isDemo: true, status: "PUBLISHED" }).lean())!._id);
  const take = (slug: string, type: QType, n: number, offset: number) => versionsBySubject[slug]!.filter((v) => v.type === type).slice(offset, offset + n);
  const makeExam = async (slug: string, title: string, parts: [QType, number, number][], mode: "MOCK" | "PRACTICE", duration: number | null, description: string) => {
    const items = parts.flatMap(([t, n, off]) => take(slug, t, n, off)).map((v) => ({ questionVersionId: v.versionId }));
    const { id } = await createExamDraft(teacherActor, { title, description, subjectId: subjectIds[slug]!, examYear: 2026, mode, durationMinutes: duration, scoringRuleId: await ruleOf(slug), resultReleasePolicy: "AFTER_SUBMISSION", items }, { isDemo: true });
    await submitExamForReview(teacherActor, id);
    await approveExam(seedAdmin, id);
    return id;
  };

  const DESC = "Đề DEMO tổng hợp từ câu hỏi giả lập để trải nghiệm hệ thống. Không phải đề thi chính thức của Bộ GD&ĐT.";
  await makeExam("toan", "[DEMO] Toán — Đề thi thử số 1", [["SINGLE_CHOICE", 6, 0], ["TRUE_FALSE", 2, 0], ["SHORT_ANSWER", 2, 0]], "MOCK", 30, DESC);
  await makeExam("toan", "[DEMO] Toán — Luyện tập tổng hợp", [["SINGLE_CHOICE", 6, 6], ["TRUE_FALSE", 2, 2], ["SHORT_ANSWER", 2, 2]], "PRACTICE", null, DESC);
  const w1 = await makeExam("toan", "[DEMO] Toán — Đề xếp hạng tuần (1/2)", [["SINGLE_CHOICE", 4, 12], ["TRUE_FALSE", 1, 4], ["SHORT_ANSWER", 1, 4]], "MOCK", 20, `${DESC} Thuộc kỳ xếp hạng tuần DEMO.`);
  const w2 = await makeExam("toan", "[DEMO] Toán — Đề xếp hạng tuần (2/2)", [["SINGLE_CHOICE", 4, 16], ["TRUE_FALSE", 1, 5], ["SHORT_ANSWER", 1, 5]], "MOCK", 20, `${DESC} Thuộc kỳ xếp hạng tuần DEMO.`);
  await makeExam("vat-li", "[DEMO] Vật lí — Đề thi thử", [["SINGLE_CHOICE", 6, 0], ["TRUE_FALSE", 2, 0], ["SHORT_ANSWER", 2, 0]], "MOCK", 25, DESC);
  await makeExam("tieng-anh", "[DEMO] Tiếng Anh — Đề thi thử", [["SINGLE_CHOICE", 8, 0]], "MOCK", 15, DESC);
  console.log("✓ 6 đề DEMO đã xuất bản");

  const camp = await createCampaign(seedAdmin, { title: "[DEMO] Toán — Xếp hạng tuần này", subjectId: subjectIds.toan!, periodType: "WEEK", referenceDate: new Date().toISOString(), examIds: [w1, w2] }, { isDemo: true });
  await activateCampaign(seedAdmin, camp.id);
  console.log(`✓ Kỳ xếp hạng tuần DEMO (${camp.periodStartAt} → ${camp.periodEndAt}) đã kích hoạt`);
  await writeAudit({ actorId: null, action: "DEMO_SEEDED", entityType: "System", metadata: { subjects: SUBJECTS.length } });
  console.log("Hoàn tất. Gỡ dữ liệu DEMO bất kỳ lúc nào bằng: pnpm seed:demo --remove");
  await disconnectFromDatabase();
}

main().catch((err) => {
  console.error("Lỗi:", err instanceof Error ? err.message.split("\n")[0] : err);
  process.exit(1);
});
