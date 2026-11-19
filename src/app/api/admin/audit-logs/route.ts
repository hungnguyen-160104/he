import { z } from "zod";
import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { paginationMeta, paginationSchema, parseSearchParams } from "@/lib/validation/common";
import { AUDIT_ACTIONS, listAuditLogs } from "@/modules/audit/service";

export const runtime = "nodejs";

const querySchema = paginationSchema.extend({ action: z.enum(AUDIT_ACTIONS).optional() });

export const GET = apiHandler(async (request) => {
  await requireApiActor(["ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  const { items, total } = await listAuditLogs(q, { action: q.action });
  return jsonOk(items, { meta: paginationMeta(q, total) });
});
