import { apiHandler, jsonOk } from "@/lib/api/handler";
import { paginationMeta, parseSearchParams } from "@/lib/validation/common";
import { listPublishedExams } from "@/modules/exams/service";
import { publicExamQuerySchema } from "@/modules/exams/validation";

export const runtime = "nodejs";

export const GET = apiHandler(async (request) => {
  const q = parseSearchParams(new URL(request.url).searchParams, publicExamQuerySchema);
  const { items, total } = await listPublishedExams(q);
  return jsonOk(items, { meta: paginationMeta(q, total), cache: "public, max-age=30, s-maxage=60" });
});
