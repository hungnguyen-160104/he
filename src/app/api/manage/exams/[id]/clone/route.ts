import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { cloneExam } from "@/modules/exams/service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  return jsonOk(await cloneExam(actor, params.id), { status: 201 });
});
