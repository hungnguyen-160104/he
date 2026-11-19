import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { adminResetUserPassword } from "@/modules/users/service";

export const runtime = "nodejs";

/** Issues a one-time temporary password (for deployments without an email provider). */
export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await enforceRateLimit(RATE_LIMITS.adminMutationByUser, actor.id);
  return jsonOk(await adminResetUserPassword(actor, params.id));
});
