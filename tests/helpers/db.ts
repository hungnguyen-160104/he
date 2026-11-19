import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { resetEnvCache } from "@/lib/env";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb/connection";

let replSet: MongoMemoryReplSet | null = null;

/** In-memory replica set (supports transactions). Never points at a real database. */
export async function startTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.MONGODB_DB_NAME = "examhub_test";
  resetEnvCache();
  await connectToDatabase();
}

/** Build all indexes for registered models (unique constraints are part of what we test). */
export async function syncAllIndexes(): Promise<void> {
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function clearDb(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function stopTestDb(): Promise<void> {
  await disconnectFromDatabase();
  await replSet?.stop();
  replSet = null;
}

export function setTestEnv(vars: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetEnvCache();
}
