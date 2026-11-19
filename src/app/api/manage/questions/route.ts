import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { paginationMeta, paginationSchema, parseSearchParams, objectIdSchema } from "@/lib/validation/common";
import { createQuestion, listManagedQuestions } from "@/modules/questions/service";
import { questionInputSchema } from "@/modules/questions/validation";
import { DIFFICULTIES, QUESTION_STATUSES, QUESTION_TYPES } from "@/modules/questions/types";

export const runtime = "nodejs";

const querySchema = paginationSchema.extend({
  subjectId: objectIdSchema.optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  status: z.enum(QUESTION_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  mine: z.enum(["1", "0"]).optional().transform((v) => v === "1"),
});

export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  const { items, total } = await listManagedQuestions(actor, q);
  return jsonOk(items, { meta: paginationMeta(q, total) });
});

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const input = await readJson(request, questionInputSchema, 48 * 1024);
  return jsonOk(await createQuestion(actor, input), { status: 201 });
});
