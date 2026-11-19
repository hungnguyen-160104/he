import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { startPracticeSession } from "@/modules/attempts/service";
import { practiceSessionSchema } from "@/modules/attempts/validation";

export const runtime = "nodejs";

/** New practice session from the approved bank (not ranked). */
export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor();
  const input = await readJson(request, practiceSessionSchema, 4096);
  return jsonOk(await startPracticeSession(actor, input), { status: 201 });
});
