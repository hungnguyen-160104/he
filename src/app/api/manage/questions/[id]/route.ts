import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { archiveQuestion, getQuestionForEditor, updateQuestion } from "@/modules/questions/service";
import { questionInputSchema } from "@/modules/questions/validation";

export const runtime = "nodejs";

const patchSchema = questionInputSchema.extend({ revision: z.number().int().min(0) });

export const GET = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const dto = await getQuestionForEditor(actor, params.id);
  return jsonOk(dto, { headers: { ETag: `"q-${dto.revision}"` } });
});

export const PATCH = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const { revision, ...input } = await readJson(request, patchSchema, 48 * 1024);
  return jsonOk(await updateQuestion(actor, params.id, input, revision));
});

/** Soft delete (archive). */
export const DELETE = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  await archiveQuestion(actor, params.id);
  return jsonOk({ archived: true });
});
