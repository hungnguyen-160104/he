import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { getExamForEditor, updateExamDraft } from "@/modules/exams/service";
import { examDraftSchema } from "@/modules/exams/validation";

export const runtime = "nodejs";

const patchSchema = z.object({ revision: z.number().int().min(0), input: examDraftSchema }).strict();

export const GET = apiHandler<{ id: string }>(async (_request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const dto = await getExamForEditor(actor, params.id);
  return jsonOk(dto, { headers: { ETag: `"e-${dto.revision}"` } });
});

export const PATCH = apiHandler<{ id: string }>(async (request, { params }) => {
  const actor = await requireApiActor(["TEACHER", "ADMIN"]);
  const { revision, input } = await readJson(request, patchSchema, 32 * 1024);
  return jsonOk(await updateExamDraft(actor, params.id, input, revision));
});
