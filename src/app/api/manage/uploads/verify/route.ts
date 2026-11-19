import { apiHandler, jsonOk, readJson } from "@/lib/api/handler";
import { requireApiActor } from "@/lib/auth/session";
import { z } from "zod";
import { verifyUploadedAsset } from "@/lib/cloudinary";

export const runtime = "nodejs";

const schema = z.object({ publicId: z.string().min(1).max(200) }).strict();

/** Verify an uploaded asset via the Cloudinary Admin API and return trusted metadata. */
export const POST = apiHandler(async (request) => {
  await requireApiActor(["TEACHER", "ADMIN"]);
  const { publicId } = await readJson(request, schema, 1024);
  return jsonOk(await verifyUploadedAsset(publicId));
});
