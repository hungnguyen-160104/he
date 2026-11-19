import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { getPracticeOptions } from "@/modules/attempts/service";

export const runtime = "nodejs";

export const GET = apiHandler(async () => {
  await requireApiActor();
  return jsonOk(await getPracticeOptions());
});
