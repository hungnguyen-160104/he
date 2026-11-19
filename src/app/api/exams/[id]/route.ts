import { apiHandler, jsonOk } from "@/lib/api/handler";
import { errors } from "@/lib/errors";
import { getPublishedExamDetail } from "@/modules/exams/service";

export const runtime = "nodejs";

/** Metadata only (no questions, no answers). */
export const GET = apiHandler<{ id: string }>(async (_request, { params }) => {
  const detail = await getPublishedExamDetail(params.id);
  if (!detail) throw errors.notFound("Không tìm thấy đề thi.");
  return jsonOk(detail, { cache: "public, max-age=30, s-maxage=60" });
});
