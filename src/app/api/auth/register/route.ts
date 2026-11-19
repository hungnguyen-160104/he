import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { clientIpFrom } from "@/lib/security/rate-limit";
import { registerStudent } from "@/modules/auth/service";
import { registerSchema } from "@/modules/auth/validation";

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  const input = await readJson(request, registerSchema, 8 * 1024);
  const result = await registerStudent(input, clientIpFrom(request.headers));
  return jsonOk(result, { status: 201 });
});
