import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { changePassword } from "@/modules/auth/service";
import { changePasswordSchema } from "@/modules/auth/validation";

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(undefined, { allowMustChangePassword: true });
  const input = await readJson(request, changePasswordSchema, 4 * 1024);
  await changePassword(actor, input);
  return jsonOk({ changed: true, reloginRequired: true });
});
