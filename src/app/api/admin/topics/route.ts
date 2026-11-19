import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { revalidateTag } from "next/cache";
import { createTopic } from "@/modules/subjects/service";
import { topicInputSchema } from "@/modules/subjects/validation";

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  const input = await readJson(request, topicInputSchema, 4096);
  const created = await createTopic(actor, input);
  revalidateTag("subjects", { expire: 0 });
  return jsonOk(created, { status: 201 });
});
