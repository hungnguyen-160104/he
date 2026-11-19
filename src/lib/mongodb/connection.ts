import "server-only";
import mongoose from "mongoose";
import { getMongoConfig } from "@/lib/env";
import { errors, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Cached Mongoose connection.
 * - Dev: cached on globalThis so HMR does not open a new pool per reload.
 * - Serverless: module scope is reused per warm instance; pool size is kept small (Atlas Free
 *   has a connection limit shared across all instances).
 * - bufferCommands=false: fail fast instead of queueing queries when disconnected.
 */
type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { __examhubMongoose?: MongooseCache };
const cache: MongooseCache = globalForMongoose.__examhubMongoose ?? { conn: null, promise: null };
globalForMongoose.__examhubMongoose = cache;

// strictQuery drops unknown filter paths. Operator injection is prevented upstream: every
// untrusted input is Zod-typed (strings/numbers only) and free-form JSON passes
// assertNoMongoOperators(). We do not enable `sanitizeFilter` because it would silently wrap
// our own trusted `$in`/`$gte` filters in `$eq`.
mongoose.set("strictQuery", true);

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    const { uri, dbName, maxPoolSize, autoIndex } = getMongoConfig();
    cache.promise = mongoose
      .connect(uri, {
        dbName,
        maxPoolSize,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 8_000,
        connectTimeoutMS: 10_000,
        socketTimeoutMS: 30_000,
        maxIdleTimeMS: 60_000,
        bufferCommands: false,
        autoIndex,
        appName: "examhub-thpt",
      })
      .catch((err: unknown) => {
        cache.promise = null;
        // Never log the URI (contains credentials).
        logger.error("mongodb.connect_failed", { name: err instanceof Error ? err.name : "unknown" });
        throw errors.dbUnavailable();
      });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (err) {
    cache.promise = null;
    if (isAppError(err)) throw err;
    throw errors.dbUnavailable();
  }
}

/** Test/scripts only. */
export async function disconnectFromDatabase(): Promise<void> {
  if (cache.conn) await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
