import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { getAttemptForTaking } from "@/modules/attempts/service";

export const runtime = "nodejs";

export const GET = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor();
  return jsonOk(await getAttemptForTaking(actor, params.id));
});
