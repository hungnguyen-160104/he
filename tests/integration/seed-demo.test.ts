import { spawnSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestDb, stopTestDb, syncAllIndexes } from "../helpers/db";
import { createUser } from "../helpers/factories";
import { SubjectModel } from "@/modules/subjects/model";
import { QuestionModel } from "@/modules/questions/model";
import { ExamModel } from "@/modules/exams/model";
import { RankingCampaignModel } from "@/modules/rankings/model";
import { UserModel } from "@/modules/users/model";

function runSeed(args: string[]) {
  const res = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/seed-demo.ts", "--yes", ...args], {
    env: { ...process.env, NODE_ENV: "test" },
    encoding: "utf8",
    timeout: 180_000,
  });
  return { code: res.status, out: `${res.stdout}\n${res.stderr}` };
}

beforeAll(async () => {
  await startTestDb();
  void [SubjectModel, QuestionModel, ExamModel, RankingCampaignModel, UserModel];
  await syncAllIndexes();
}, 120_000);
afterAll(stopTestDb);

describe("pnpm seed:demo", () => {
  it("creates DEMO data, is idempotent, and --remove deletes only DEMO data", async () => {
    const realStudent = await createUser({ username: "hoc_sinh_that" });

    const first = runSeed([]);
    expect(first.code, first.out).toBe(0);
    expect(await SubjectModel.countDocuments({ isDemo: true })).toBe(11);
    // Default profile: one full exam per subject (Toán 22, Tiếng Anh 40, 9 others × 28 questions), no campaign.
    expect(await QuestionModel.countDocuments({ isDemo: true, status: "PUBLISHED" })).toBe(314);
    const exams = await ExamModel.find({ isDemo: true, publishStatus: "PUBLISHED" }).lean();
    expect(exams.map((e) => [e.items.length, e.durationMinutes, e.totalMaxRawPoints]).sort()).toEqual([
      [22, 90, "10"],
      ...Array.from({ length: 9 }, () => [28, 50, "10"]),
      [40, 50, "10"],
    ]);
    expect(await RankingCampaignModel.countDocuments({ isDemo: true })).toBe(0);
    const demoTeacher = await UserModel.findOne({ usernameNormalized: "demo_giaovien" }).lean();
    expect(demoTeacher?.isDemo).toBe(true);

    const second = runSeed([]);
    expect(second.code, second.out).toBe(0);
    expect(second.out).toContain("bỏ qua");
    expect(await ExamModel.countDocuments({ isDemo: true })).toBe(11);

    const dry = runSeed(["--remove", "--dry-run"]);
    expect(dry.code, dry.out).toBe(0);
    expect(await ExamModel.countDocuments({ isDemo: true })).toBe(11);

    const removed = runSeed(["--remove"]);
    expect(removed.code, removed.out).toBe(0);
    expect(await SubjectModel.countDocuments({ isDemo: true })).toBe(0);
    expect(await QuestionModel.countDocuments({})).toBe(0);
    expect(await ExamModel.countDocuments({})).toBe(0);
    expect(await UserModel.countDocuments({ isDemo: true })).toBe(0);
    expect(await UserModel.exists({ _id: realStudent._id })).toBeTruthy();
  }, 300_000);
});
