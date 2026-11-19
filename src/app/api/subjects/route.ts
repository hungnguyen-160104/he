import { apiHandler, jsonOk } from "@/lib/api/handler";
import { listActiveSubjects } from "@/modules/subjects/service";

export const runtime = "nodejs";

export const GET = apiHandler(async () => jsonOk(await listActiveSubjects(), { cache: "public, max-age=60, s-maxage=120" }));
