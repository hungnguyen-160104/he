import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { paginationMeta, parseSearchParams } from "@/lib/validation/common";
import { adminCreateTeacher, adminListUsers } from "@/modules/users/service";
import { createTeacherSchema, listUsersQuerySchema } from "@/modules/users/validation";

export const runtime = "nodejs";

export const GET = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, listUsersQuerySchema);
  const { items, total } = await adminListUsers(actor, { ...q, role: "TEACHER" });
  return jsonOk(items, { meta: paginationMeta(q, total) });
});

/** Creates a TEACHER with a one-time temporary password (must be changed at first login). */
export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  await enforceRateLimit(RATE_LIMITS.adminMutationByUser, actor.id);
  const input = await readJson(request, createTeacherSchema, 2 * 1024);
  return jsonOk(await adminCreateTeacher(actor, input), { status: 201 });
});
