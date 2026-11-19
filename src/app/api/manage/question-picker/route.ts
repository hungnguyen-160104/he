import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { objectIdSchema, paginationMeta, paginationSchema, parseSearchParams } from "@/lib/validation/common";
import { listPickableQuestions } from "@/modules/exams/service";
import { DIFFICULTIES, QUESTION_TYPES } from "@/modules/questions/types";

export const runtime = "nodejs";

const querySchema = paginationSchema.extend({
  subjectId: objectIdSchema,
  type: z.enum(QUESTION_TYPES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  topicId: objectIdSchema.optional(),
  q: z.string().trim().max(100).optional(),
});

export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  const { items, total } = await listPickableQuestions(actor, q);
  return jsonOk(items, { meta: paginationMeta(q, total) });
});
