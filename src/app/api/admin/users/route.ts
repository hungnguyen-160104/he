import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { paginationMeta, parseSearchParams } from "@/lib/validation/common";
import { adminListUsers } from "@/modules/users/service";
import { listUsersQuerySchema } from "@/modules/users/validation";

export const runtime = "nodejs";

export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, listUsersQuerySchema);
  const { items, total } = await adminListUsers(actor, q);
  return jsonOk(items, { meta: paginationMeta(q, total) });
});
