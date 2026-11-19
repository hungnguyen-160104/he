import { apiHandler, jsonOk } from "@/lib/api/handler";
import { listTopics } from "@/modules/subjects/service";

export const runtime = "nodejs";

export const GET = apiHandler<{ id: string }>(async (_req, { params }) =>
  jsonOk(await listTopics(params.id), { cache: "public, max-age=60, s-maxage=120" }),
);
