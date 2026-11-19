import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { approveQuestion } from "@/modules/questions/service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await approveQuestion(actor, params.id);
  return jsonOk({ status: "PUBLISHED" });
});
