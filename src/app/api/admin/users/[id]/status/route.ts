import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { adminSetUserStatus } from "@/modules/users/service";
import { updateUserStatusSchema } from "@/modules/users/validation";

export const runtime = "nodejs";

export const PATCH = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await enforceRateLimit(RATE_LIMITS.adminMutationByUser, actor.id);
  const { status } = await readJson(request, updateUserStatusSchema, 512);
  return jsonOk(await adminSetUserStatus(actor, params.id, status));
});
