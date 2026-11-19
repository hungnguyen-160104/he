import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { finalizeCampaign } from "@/modules/rankings/service";

export const runtime = "nodejs";

/** Call repeatedly while `done` is false (batch reconciliation within serverless limits). */
export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  return jsonOk(await finalizeCampaign(actor, params.id));
});
