import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { objectIdSchema, paginationMeta, paginationSchema, parseSearchParams } from "@/lib/validation/common";
import { createExamDraft, listManagedExams } from "@/modules/exams/service";
import { EXAM_STATUSES, examDraftSchema } from "@/modules/exams/validation";

export const runtime = "nodejs";

const querySchema = paginationSchema.extend({
  status: z.enum(EXAM_STATUSES).optional(),
  subjectId: objectIdSchema.optional(),
  mine: z.enum(["1", "0"]).optional().transform((v) => v === "1"),
});

export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  const { items, total } = await listManagedExams(actor, q);
  return jsonOk(items, { meta: paginationMeta(q, total) });
});

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const input = await readJson(request, examDraftSchema, 32 * 1024);
  return jsonOk(await createExamDraft(actor, input), { status: 201 });
});
