import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { adminSetUserRole } from "@/modules/users/service";
import { updateUserRoleSchema } from "@/modules/users/validation";

export const runtime = "nodejs";

export const PATCH = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await enforceRateLimit(RATE_LIMITS.adminMutationByUser, actor.id);
  const { role } = await readJson(request, updateUserRoleSchema, 512);
  return jsonOk(await adminSetUserRole(actor, params.id, role));
});
