import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { parseSearchParams } from "@/lib/validation/common";
import { PERIOD_TYPES } from "@/lib/utils/period";
import { previewPeriod } from "@/modules/rankings/service";

export const runtime = "nodejs";

const querySchema = z.object({ periodType: z.enum(PERIOD_TYPES), date: z.iso.datetime({ offset: true }) });

/** Preview period bounds in Asia/Ho_Chi_Minh before creating a campaign. */
export const GET = apiHandler(async (request) => {
  await requireApiActor(["ADMIN"]);
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  return jsonOk(previewPeriod(q.periodType, new Date(q.date)));
});
