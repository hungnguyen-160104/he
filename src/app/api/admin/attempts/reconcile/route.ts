import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { reconcileExpiredAttempts } from "@/modules/attempts/service";
import { writeAudit } from "@/modules/audit/service";

export const runtime = "nodejs";

/** Bounded batch: finalizes up to 100 expired attempts per call (no cron needed). */
export const POST = apiHandler(async () => {
  const actor = await requireApiActor(["ADMIN"]);
  const res = await reconcileExpiredAttempts({ limit: 100 });
  if (res.processed) await writeAudit({ actorId: actor.id, action: "ATTEMPTS_RECONCILED", entityType: "Attempt", metadata: res });
  return jsonOk(res);
});
