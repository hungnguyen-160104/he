import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { saveAnswers } from "@/modules/attempts/service";
import { saveAnswersSchema } from "@/modules/attempts/validation";

export const runtime = "nodejs";

export const PATCH = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor();
  const input = await readJson(request, saveAnswersSchema, 32 * 1024);
  return jsonOk(await saveAnswers(actor, params.id, input));
});
