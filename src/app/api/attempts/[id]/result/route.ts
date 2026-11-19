import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { getAttemptResult } from "@/modules/attempts/service";

export const runtime = "nodejs";

/** Answers/explanations only when the release policy allows. */
export const GET = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor();
  return jsonOk(await getAttemptResult(actor, params.id));
});
