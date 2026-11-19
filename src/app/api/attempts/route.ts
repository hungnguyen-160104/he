import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { objectIdSchema, paginationMeta, paginationSchema, parseSearchParams } from "@/lib/validation/common";
import { listMyAttempts, startExamAttempt } from "@/modules/attempts/service";
import { startAttemptSchema } from "@/modules/attempts/validation";

export const runtime = "nodejs";

const querySchema = paginationSchema.extend({
  subjectId: objectIdSchema.optional(),
  mode: z.enum(["PRACTICE", "MOCK"]).optional(),
  status: z.enum(["IN_PROGRESS", "DONE"]).optional(),
});

/** The user id always comes from the session — never from the request. */
export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor();
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  const { items, total } = await listMyAttempts(actor, q);
  return jsonOk(items, { meta: paginationMeta(q, total) });
});

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor();
  const input = await readJson(request, startAttemptSchema, 1024);
  const res = await startExamAttempt(actor, input);
  return jsonOk(res, { status: res.resumed ? 200 : 201 });
});
