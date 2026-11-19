import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearDb, setTestEnv, startTestDb, stopTestDb, syncAllIndexes } from "../helpers/db";
import { actorOf, createUser } from "../helpers/factories";
import { createSubjectFixture, saInput, scInput, tfInput } from "../helpers/fixtures";
import { AppError } from "@/lib/errors";
import { QuestionKeyModel, QuestionModel, QuestionVersionModel } from "@/modules/questions/model";
import {
  approveQuestion,
  archiveQuestion,
  createQuestion,
  getQuestionForEditor,
  listManagedQuestions,
  listQuestionReviewQueue,
  rejectQuestion,
  requestQuestionReview,
  updateQuestion,
} from "@/modules/questions/service";
import { toStudentQuestionView } from "@/modules/questions/dto";
import { createSubject, createTopic, deleteSubject, deleteTopic } from "@/modules/subjects/service";
import { SubjectModel, TopicModel } from "@/modules/subjects/model";
import { createUploadSignature, assertMediaRefsAllowed } from "@/lib/cloudinary";
import type { Actor } from "@/modules/users/permissions";

async function expectAppError(p: Promise<unknown> | (() => unknown), status: number) {
  const promise = typeof p === "function" ? Promise.resolve().then(p) : p;
  await expect(promise).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === status);
}

let admin: Actor, teacher: Actor, teacher2: Actor, student: Actor;
let subjectId: string, topicId: string;

beforeAll(async () => {
  await startTestDb();
  void [QuestionModel, QuestionVersionModel, QuestionKeyModel, SubjectModel, TopicModel];
  await syncAllIndexes();
});
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  setTestEnv({ CLOUDINARY_CLOUD_NAME: undefined, CLOUDINARY_API_KEY: undefined, CLOUDINARY_API_SECRET: undefined });
  admin = actorOf(await createUser({ username: "admin", role: "ADMIN" }));
  teacher = actorOf(await createUser({ username: "gv1", role: "TEACHER" }));
  teacher2 = actorOf(await createUser({ username: "gv2", role: "TEACHER" }));
  student = actorOf(await createUser({ username: "hs1" }));
  ({ subjectId, topicId } = await createSubjectFixture("toan"));
});

describe("subjects & topics", () => {
  const input = { name: "Vật lí", slug: "vat-li", code: "LY", allowedQuestionTypes: ["SINGLE_CHOICE" as const] };
  it("admin creates subject; duplicate slug → 409; teacher/student → 403", async () => {
    await createSubject(admin, input);
    await expectAppError(createSubject(admin, { ...input, code: "LY2" }), 409);
    await expectAppError(createSubject(teacher, { ...input, slug: "x", code: "X" }), 403);
    await expectAppError(createSubject(student, { ...input, slug: "y", code: "Y" }), 403);
  });
  it("refuses to hard-delete referenced subjects/topics", async () => {
    await expectAppError(deleteSubject(admin, subjectId), 422);
    await createQuestion(teacher, scInput(subjectId, [topicId]));
    await expectAppError(deleteTopic(admin, topicId), 422);
    const s = await createSubject(admin, input);
    await deleteSubject(admin, s.id);
    expect(await SubjectModel.exists({ _id: s.id })).toBeNull();
  });
  it("validates topic parent belongs to same subject and depth ≤ 2", async () => {
    const other = await createSubjectFixture("ly");
    await expectAppError(createTopic(admin, { subjectId, parentId: other.topicId, name: "Sai", slug: "sai" }), 422);
    const child = await createTopic(admin, { subjectId, parentId: topicId, name: "Con", slug: "con" });
    await expectAppError(createTopic(admin, { subjectId, parentId: child.id, name: "Cháu", slug: "chau" }), 422);
  });
});

describe("question bank", () => {
  it("students cannot create; type must be allowed by the subject; topics must match", async () => {
    await expectAppError(createQuestion(student, scInput(subjectId)), 403);
    const en = await createSubjectFixture("tieng-anh", ["SINGLE_CHOICE"]);
    await expectAppError(createQuestion(teacher, tfInput(en.subjectId)), 422);
    const ly = await createSubjectFixture("vat-li");
    await expectAppError(createQuestion(teacher, scInput(subjectId, [ly.topicId])), 422);
  });

  it("creates all 3 types; key lives only in question_keys", async () => {
    for (const input of [scInput(subjectId, [topicId]), tfInput(subjectId), saInput(subjectId)]) {
      const { id } = await createQuestion(teacher, input);
      const v = await QuestionVersionModel.findOne({ questionId: id }).lean();
      const json = JSON.stringify(v);
      expect(json).not.toMatch(/correctOptionId|acceptedAnswers|"values"|explanation/);
      expect(await QuestionKeyModel.countDocuments({ questionVersionId: v!._id })).toBe(1);
    }
  });

  it("ownership: another teacher cannot read/edit/submit; admin can", async () => {
    const { id } = await createQuestion(teacher, scInput(subjectId));
    await expectAppError(getQuestionForEditor(teacher2, id), 403);
    await expectAppError(updateQuestion(teacher2, id, scInput(subjectId), 0), 403);
    await expectAppError(requestQuestionReview(teacher2, id), 403);
    await expectAppError(archiveQuestion(teacher2, id), 403);
    expect((await getQuestionForEditor(admin, id)).body).toMatchObject({ key: { correctOptionId: "B" } });
    const list = await listManagedQuestions(teacher2, { page: 1, limit: 20 });
    expect(list.total).toBe(0);
  });

  it("drafts are edited in place; approved versions are immutable and edits create a new version", async () => {
    const { id } = await createQuestion(teacher, scInput(subjectId));
    const r1 = await updateQuestion(teacher, id, scInput(subjectId, [], "Giá trị của $2+3$ bằng bao nhiêu?"), 0);
    expect(r1).toMatchObject({ versionNumber: 1, createdNewVersion: false, revision: 1 });

    await requestQuestionReview(teacher, id);
    await expectAppError(approveQuestion(teacher, id), 403);
    await approveQuestion(admin, id);
    const q1 = await QuestionModel.findById(id).lean();
    const v1 = await QuestionVersionModel.findById(q1!.publishedVersionId).lean();
    expect(q1!.status).toBe("PUBLISHED");
    expect(v1!.isImmutable).toBe(true);

    const r2 = await updateQuestion(teacher, id, scInput(subjectId, [], "Câu hỏi đã sửa", "C"), q1!.revision);
    expect(r2).toMatchObject({ versionNumber: 2, createdNewVersion: true });
    const v1After = await QuestionVersionModel.findById(v1!._id).lean();
    expect((v1After!.content as { stem: string }).stem).toBe("Giá trị của $2+3$ bằng bao nhiêu?");
    const k1 = await QuestionKeyModel.findOne({ questionVersionId: v1!._id }).lean();
    expect(k1!.answerData).toEqual({ correctOptionId: "B" });
    const q2 = await QuestionModel.findById(id).lean();
    expect(String(q2!.publishedVersionId)).toBe(String(v1!._id)); // old version stays published
    expect(q2!.status).toBe("DRAFT");
  });

  it("stale revision → 409 conflict", async () => {
    const { id } = await createQuestion(teacher, scInput(subjectId));
    await updateQuestion(teacher, id, scInput(subjectId, [], "Sửa lần 1"), 0);
    await expectAppError(updateQuestion(teacher, id, scInput(subjectId, [], "Sửa từ tab cũ"), 0), 409);
  });

  it("type and subject cannot be changed", async () => {
    const { id } = await createQuestion(teacher, scInput(subjectId));
    await expectAppError(updateQuestion(teacher, id, tfInput(subjectId), 0), 422);
  });

  it("reject requires a reason; review queue shows content + key to admin only", async () => {
    const { id } = await createQuestion(teacher, saInput(subjectId));
    await requestQuestionReview(teacher, id);
    await expectAppError(listQuestionReviewQueue(teacher, { page: 1, limit: 20 }), 403);
    const queue = await listQuestionReviewQueue(admin, { page: 1, limit: 20 });
    expect(queue.items[0]?.body).toMatchObject({ key: { acceptedAnswers: ["1,5"] } });
    await expect(rejectQuestion(admin, id, { reason: "" })).rejects.toThrow();
    await rejectQuestion(admin, id, { reason: "Đáp án cần thêm dạng 3/2." });
    const q = await QuestionModel.findById(id).lean();
    expect(q).toMatchObject({ status: "REJECTED", reviewNotes: "Đáp án cần thêm dạng 3/2." });
    await requestQuestionReview(teacher, id); // can resubmit
  });

  it("archive is a soft delete", async () => {
    const { id } = await createQuestion(teacher, scInput(subjectId));
    await archiveQuestion(teacher, id);
    expect((await QuestionModel.findById(id).lean())?.status).toBe("ARCHIVED");
    await expectAppError(updateQuestion(teacher, id, scInput(subjectId), 1), 422);
  });

  it("student view DTO never contains answers, even nested", async () => {
    const { id } = await createQuestion(teacher, tfInput(subjectId));
    const v = await QuestionVersionModel.findOne({ questionId: id }).lean();
    const view = toStudentQuestionView(v!);
    expect(Object.keys(view).sort()).toEqual(["media", "statements", "stem", "type"]);
    expect(JSON.stringify(view)).not.toMatch(/:(true|false)\b|"values"|explanation|"key"/);
  });
});

describe("media & Cloudinary", () => {
  const media = {
    publicId: "examhub/questions/abc",
    secureUrl: "https://res.cloudinary.com/demo-cloud/image/upload/v1/examhub/questions/abc.png",
    width: 10,
    height: 10,
    format: "png" as const,
    bytes: 100,
    alt: "Hình minh họa",
  };

  it("without Cloudinary config: questions without images still work; images and signatures are refused (503)", async () => {
    await createQuestion(teacher, scInput(subjectId));
    const withImage = scInput(subjectId);
    (withImage.body.content as { media: unknown[] }).media = [media];
    await expectAppError(createQuestion(teacher, withImage), 503);
    await expectAppError(() => createUploadSignature(), 503);
  });

  it("with config: signature never exposes the API secret; foreign assets are refused", async () => {
    // Test-only placeholder values (no network call is made for signing).
    setTestEnv({ CLOUDINARY_CLOUD_NAME: "demo-cloud", CLOUDINARY_API_KEY: "111111", CLOUDINARY_API_SECRET: "test-secret-value-not-real" });
    const sig = createUploadSignature();
    expect(JSON.stringify(sig)).not.toContain("test-secret-value-not-real");
    expect(sig.folder).toBe("examhub/questions");
    expect(sig.allowedFormats).toBe("jpg,png,webp");
    expect(() => assertMediaRefsAllowed([media])).not.toThrow();
    expect(() => assertMediaRefsAllowed([{ ...media, secureUrl: media.secureUrl.replace("demo-cloud", "other-cloud") }])).toThrow(AppError);
    expect(() => assertMediaRefsAllowed([{ ...media, publicId: "other/abc", secureUrl: media.secureUrl.replace("examhub/questions/abc", "other/abc") }])).toThrow(AppError);
  });
});
