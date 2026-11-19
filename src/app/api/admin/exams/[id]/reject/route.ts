import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { rejectExam } from "@/modules/exams/service";
import { rejectSchema } from "@/modules/questions/validation";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  const input = await readJson(request, rejectSchema, 4096);
  await rejectExam(actor, params.id, input);
  return jsonOk({ status: "REJECTED" });
});
