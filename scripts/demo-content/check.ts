/**
 * Quick validator for one DEMO content file (the full suite lives in tests/unit/demo-content.test.ts):
 *   node --conditions=react-server --import tsx scripts/demo-content/check.ts scripts/demo-content/sinh-hoc.ts
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { topicSlug, type DemoExam } from "./builders";
import { EXPECTED_STRUCTURE } from "./structure";
import { questionBodySchema } from "@/modules/questions/validation";
import { findLatexErrors } from "@/lib/rich-text/parse";
import { parseNumberAnswer } from "@/modules/grading/short-answer";
import { gradeExam, type GradableItem } from "@/modules/grading/engine";
import { typeRulesSchema } from "@/modules/grading/rule";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: check.ts <content-file.ts>");
  const mod = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>;
  const exams = Object.values(mod).flat().filter((v): v is DemoExam => typeof v === "object" && v !== null && "questions" in v && "slug" in v);
  if (!exams.length) throw new Error("no DemoExam export found");
  let errors = 0;
  const fail = (msg: string) => {
    errors++;
    console.error("✗", msg);
  };
  for (const exam of exams) {
    const exp = EXPECTED_STRUCTURE[exam.slug];
    if (!exp) fail(`${exam.slug}: no EXPECTED_STRUCTURE entry`);
    for (const t of exam.topics) if (t.length > 120 || topicSlug(t).length > 60) fail(`${exam.slug}: topic "${t}" too long (name ≤ 120, slug ≤ 60)`);
    const count = (p: string) => exam.questions.filter((q) => q.part === p).length;
    const got = { I: count("I"), II: count("II"), III: count("III"), minutes: exam.durationMinutes };
    if (exp && JSON.stringify(got) !== JSON.stringify(exp)) fail(`${exam.slug}: structure ${JSON.stringify(got)} ≠ ${JSON.stringify(exp)}`);
    exam.questions.forEach((q, i) => {
      const where = `${exam.slug} #${i + 1} (${q.part})`;
      const parsed = questionBodySchema.safeParse(q.body);
      if (!parsed.success) fail(`${where}: ${JSON.stringify(parsed.error.issues)}`);
      if (q.topic < 0 || q.topic >= exam.topics.length) fail(`${where}: topic index ${q.topic} out of range`);
      if ((q.body.explanation ?? "").trim().length <= 10) fail(`${where}: explanation too short`);
      const texts = [q.body.content.stem, q.body.explanation ?? ""];
      if (q.body.type === "SINGLE_CHOICE") {
        texts.push(...q.body.content.options.map((o) => o.text));
        if (new Set(q.body.content.options.map((o) => o.text)).size !== 4) fail(`${where}: duplicate options`);
      }
      if (q.body.type === "TRUE_FALSE") texts.push(...q.body.content.statements.map((s) => s.text));
      if (q.body.type === "SHORT_ANSWER") {
        const a = q.body.key.acceptedAnswers[0]!;
        if (a.length > 4 || !parseNumberAnswer(a)) fail(`${where}: short answer "${a}" must be a number of ≤ 4 characters`);
      }
      for (const t of texts) if (findLatexErrors(t).length) fail(`${where}: LaTeX error in "${t.slice(0, 60)}…"`);
    });
    const rules = typeRulesSchema.parse({
      SINGLE_CHOICE: { points: "0.25" },
      TRUE_FALSE: { pointsByCorrectCount: ["0", "0.1", "0.25", "0.5", "1"] },
      SHORT_ANSWER: { points: exam.shortAnswerPoints },
    });
    const items: GradableItem[] = exam.questions.map((q, i) => {
      const b = q.body;
      if (b.type === "SINGLE_CHOICE") return { itemId: String(i), type: b.type, key: b.key, response: { optionId: b.key.correctOptionId } };
      if (b.type === "TRUE_FALSE") return { itemId: String(i), type: b.type, key: b.key, response: { values: b.key.values } };
      return { itemId: String(i), type: b.type, key: b.key, response: { text: b.key.acceptedAnswers[0]! } };
    });
    const g = gradeExam(items, rules);
    if (g.scoreScaled !== 10_000) fail(`${exam.slug}: perfect sheet scores ${g.scoreScaled}/10000 (max raw ${g.maxRaw})`);
    const letters = exam.questions.flatMap((q) => (q.body.type === "SINGLE_CHOICE" ? [q.body.key.correctOptionId] : []));
    const spread = Object.fromEntries(["A", "B", "C", "D"].map((l) => [l, letters.filter((x) => x === l).length]));
    console.log(`${exam.slug}: ${exam.questions.length} câu ${JSON.stringify(got)}, đáp án ${JSON.stringify(spread)}, điểm tối đa ${g.scoreScaled / 1000}`);
  }
  if (errors) {
    console.error(`${errors} lỗi`);
    process.exit(1);
  }
  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
