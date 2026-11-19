import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { getMyRankingProgress } from "@/modules/rankings/service";

export const runtime = "nodejs";

export const GET = apiHandler(async () => {
  const actor = await requireApiActor();
  return jsonOk(await getMyRankingProgress(actor));
});
