import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { submitExamForReview } from "@/modules/exams/service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  await submitExamForReview(actor, params.id);
  return jsonOk({ status: "PENDING_REVIEW" });
});
