import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { releaseExamResults } from "@/modules/exams/service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await releaseExamResults(actor, params.id);
  return jsonOk({ released: true });
});
