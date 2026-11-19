import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { publishScoringRule } from "@/modules/exams/scoring-service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await publishScoringRule(actor, params.id);
  return jsonOk({ status: "PUBLISHED" });
});
