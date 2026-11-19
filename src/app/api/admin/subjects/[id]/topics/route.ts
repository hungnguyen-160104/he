import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { listTopics } from "@/modules/subjects/service";

export const runtime = "nodejs";

/** Includes inactive topics (staff editors). */
export const GET = apiHandler<{ id: string }>(async (_req, { params }) => {
  await requireApiActor(["ADMIN", "TEACHER"]);
  return jsonOk(await listTopics(params.id, { includeInactive: true }));
});
