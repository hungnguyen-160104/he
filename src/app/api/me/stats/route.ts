import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { getMyStats } from "@/modules/attempts/service";

export const runtime = "nodejs";

export const GET = apiHandler(async () => {
  const actor = await requireApiActor();
  return jsonOk(await getMyStats(actor));
});
