import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { adminListCampaigns, campaignInputSchema, createCampaign } from "@/modules/rankings/service";

export const runtime = "nodejs";

export const GET = apiHandler(async () => {
  const actor = await requireApiActor(["ADMIN"]);
  return jsonOk(await adminListCampaigns(actor));
});

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  const input = await readJson(request, campaignInputSchema, 4096);
  return jsonOk(await createCampaign(actor, input), { status: 201 });
});
