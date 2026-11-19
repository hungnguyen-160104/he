import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { createUploadSignature } from "@/lib/cloudinary";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/** Short-lived signed upload params. The API secret is never returned. */
export const POST = apiHandler(async () => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  await enforceRateLimit(RATE_LIMITS.uploadByUser, actor.id);
  return jsonOk(createUploadSignature());
});
