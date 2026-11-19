import { apiHandler, jsonOk } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { revalidateTag } from "next/cache";
import { approveExam } from "@/modules/exams/service";

export const runtime = "nodejs";

export const POST = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await approveExam(actor, params.id);
  revalidateTag("exams", { expire: 0 });
  return jsonOk({ status: "PUBLISHED" });
});
