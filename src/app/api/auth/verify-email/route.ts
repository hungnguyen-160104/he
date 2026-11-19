import { z } from "zod";
import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { verifyEmail } from "@/modules/auth/service";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(20).max(200) }).strict();

export const POST = apiHandler(async (request) => {
  const { token } = await readJson(request, schema, 1024);
  await verifyEmail(token);
  return jsonOk({ verified: true });
});
