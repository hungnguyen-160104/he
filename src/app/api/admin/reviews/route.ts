import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { paginationMeta, paginationSchema, parseSearchParams } from "@/lib/validation/common";
import { listManagedExams } from "@/modules/exams/service";
import { listQuestionReviewQueue } from "@/modules/questions/service";

export const runtime = "nodejs";

const querySchema = paginationSchema.extend({ kind: z.enum(["questions", "exams"]).default("exams") });

export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  const { items, total } = q.kind === "questions" ? await listQuestionReviewQueue(actor, q) : await listManagedExams(actor, { ...q, status: "PENDING_REVIEW" });
  return jsonOk(items, { meta: paginationMeta(q, total) });
});
