import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { adminGetCampaign } from "@/modules/rankings/service";

export const runtime = "nodejs";

export const GET = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  return jsonOk(await adminGetCampaign(actor, params.id));
});
