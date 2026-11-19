import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { getProfile, updateProfile } from "@/modules/users/service";
import { updateProfileSchema } from "@/modules/users/validation";

export const runtime = "nodejs";

export const GET = apiHandler(async () => {
  const actor = await requireApiActor(undefined, { allowMustChangePassword: true });
  return jsonOk(await getProfile(actor));
});

export const PATCH = apiHandler(async (request) => {
  const actor = await requireApiActor();
  const input = await readJson(request, updateProfileSchema, 2 * 1024);
  return jsonOk(await updateProfile(actor, input));
});
