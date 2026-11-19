import { z } from "zod";
import { apiHandler, jsonOk } from "@/lib/api/handler";
import { getActor } from "@/lib/auth/session";
import { objectIdSchema, parseSearchParams } from "@/lib/validation/common";
import { PERIOD_TYPES } from "@/lib/utils/period";
import { getLeaderboard, listVisibleCampaigns } from "@/modules/rankings/service";

export const runtime = "nodejs";

const querySchema = z.object({
  subjectId: objectIdSchema.optional(),
  periodType: z.enum(PERIOD_TYPES).optional(),
  campaignId: objectIdSchema.optional(),
  limit: z.coerce.number().refine((n) => [10, 50, 100].includes(n), "limit phải là 10, 50 hoặc 100").default(10),
});

/** Public leaderboard (nickname-only projection). Logged-in users also get their own position. */
export const GET = apiHandler(async (request) => {
  const q = parseSearchParams(new URL(request.url).searchParams, querySchema);
  const campaigns = await listVisibleCampaigns({ subjectId: q.subjectId, periodType: q.periodType });
  const selected = q.campaignId ?? campaigns.find((c) => c.isLive)?.id ?? campaigns[0]?.id ?? null;
  const viewer = await getActor().catch(() => null);
  const leaderboard = selected ? await getLeaderboard(selected, { limit: q.limit, viewerId: viewer?.id ?? null }) : null;
  return jsonOk({ campaigns, leaderboard });
});
