import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { objectIdSchema, parseSearchParams } from "@/lib/validation/common";
import { scoringRuleInputSchema } from "@/modules/grading/rule";
import { createScoringRule, listScoringRules } from "@/modules/exams/scoring-service";

export const runtime = "nodejs";

const querySchema = z.object({ subjectId: objectIdSchema.optional(), published: z.enum(["1", "0"]).optional() });

/** Teachers may read (exam builder); only admins create. */
export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  return jsonOk(await listScoringRules(actor, { subjectId: q.subjectId, publishedOnly: q.published === "1" || actor.role === "TEACHER" }));
});

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  const input = await readJson(request, scoringRuleInputSchema, 8 * 1024);
  return jsonOk(await createScoringRule(actor, input), { status: 201 });
});
