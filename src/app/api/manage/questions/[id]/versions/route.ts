import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { updateQuestion } from "@/modules/questions/service";
import { questionInputSchema } from "@/modules/questions/validation";

export const runtime = "nodejs";

const schema = questionInputSchema.extend({ revision: z.number().int().min(0) });

/** Explicitly create a new version (even if the latest version is still a mutable draft). */
export const POST = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const { revision, ...input } = await readJson(request, schema, 48 * 1024);
  return jsonOk(await updateQuestion(actor, params.id, input, revision, { forceNewVersion: true }), { status: 201 });
});
