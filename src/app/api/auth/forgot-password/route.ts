import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { clientIpFrom } from "@/lib/security/rate-limit";
import { requestPasswordReset } from "@/modules/auth/service";
import { forgotPasswordSchema } from "@/modules/auth/validation";

export const runtime = "nodejs";

/** Same response whether or not the email exists. */
export const POST = apiHandler(async (request) => {
  const input = await readJson(request, forgotPasswordSchema, 2 * 1024);
  await requestPasswordReset(input, clientIpFrom(request.headers));
  return jsonOk({ accepted: true }, { status: 202 });
});
