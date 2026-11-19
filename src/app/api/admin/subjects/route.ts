import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { revalidateTag } from "next/cache";
import { adminListSubjects, createSubject } from "@/modules/subjects/service";
import { subjectInputSchema } from "@/modules/subjects/validation";

export const runtime = "nodejs";

export const GET = apiHandler(async () => {
  const actor = await requireApiActor(["ADMIN", "TEACHER"]);
  return jsonOk(await adminListSubjects(actor));
});

export const POST = apiHandler(async (request) => {
  const actor = await requireApiActor(["ADMIN"]);
  const input = await readJson(request, subjectInputSchema, 4096);
  const created = await createSubject(actor, input);
  revalidateTag("subjects", { expire: 0 });
  return jsonOk(created, { status: 201 });
});
