import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { clientIpFrom } from "@/lib/security/rate-limit";
import { resetPassword } from "@/modules/auth/service";
import { resetPasswordSchema } from "@/modules/auth/validation";

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  const input = await readJson(request, resetPasswordSchema, 4 * 1024);
  await resetPassword(input, clientIpFrom(request.headers));
  return jsonOk({ reset: true });
});
