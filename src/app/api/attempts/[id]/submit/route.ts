import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { submitAttempt } from "@/modules/attempts/service";

export const runtime = "nodejs";

/** Exactly-once: repeated submits return the same result. */
export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor();
  return jsonOk(await submitAttempt(actor, params.id));
});
