import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { activateCampaign } from "@/modules/rankings/service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  return jsonOk(await activateCampaign(actor, params.id));
});
