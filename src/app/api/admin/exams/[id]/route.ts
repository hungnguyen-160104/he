import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { getExamForReview } from "@/modules/exams/service";

export const runtime = "nodejs";

/** Review detail with content AND keys — admin only. */
export const GET = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  return jsonOk(await getExamForReview(actor, params.id));
});
