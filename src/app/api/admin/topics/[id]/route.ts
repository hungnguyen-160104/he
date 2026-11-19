import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { revalidateTag } from "next/cache";
import { deleteTopic, updateTopic } from "@/modules/subjects/service";
import { topicPatchSchema } from "@/modules/subjects/validation";

export const runtime = "nodejs";

export const PATCH = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  const input = await readJson(request, topicPatchSchema, 4096);
  const updated = await updateTopic(actor, params.id, input);
  revalidateTag("subjects", { expire: 0 });
  return jsonOk(updated);
});

export const DELETE = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["ADMIN"]);
  await deleteTopic(actor, params.id);
  revalidateTag("subjects", { expire: 0 });
  return jsonOk({ deleted: true });
});
