import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { requestQuestionReview } from "@/modules/questions/service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  await requestQuestionReview(actor, params.id);
  return jsonOk({ status: "IN_REVIEW" });
});
