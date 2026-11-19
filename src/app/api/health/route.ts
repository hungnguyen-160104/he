import { apiHandler, jsonOk } from "@/lib/api/handler";
import { getConfigStatus } from "@/lib/env";
import { connectToDatabase } from "@/lib/mongodb/connection";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness + configuration status. Booleans only — never values of secrets. */
export const GET = apiHandler(async () => {
  const config = getConfigStatus();
  let database: "not_configured" | "ok" | "unavailable" = "not_configured";
  if (config.database) {
    try {
      await connectToDatabase();
      await mongoose.connection.db?.admin().ping();
      database = "ok";
    } catch {
      database = "unavailable";
    }
  }
  return jsonOk({ status: "ok", database, config, time: new Date().toISOString() });
});
