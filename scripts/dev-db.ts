/**
 * pnpm db:local — local, PERSISTENT MongoDB for development (no Docker, no install).
 * Uses the mongod binary cached by mongodb-memory-server, stores data in ./.data/mongodb
 * (gitignored) and runs as a single-node replica set (transactions are required by the app).
 *
 *   MONGODB_URI=mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true
 *
 * Keep this terminal open while developing; Ctrl+C stops the database (data is kept).
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { MongoBinary } from "mongodb-memory-server";

const PORT = Number(process.env.LOCAL_MONGO_PORT ?? 27018);
const DB_PATH = path.join(process.cwd(), ".data", "mongodb");

async function waitForPort(uri: string, tries = 60): Promise<mongoose.Connection> {
  for (let i = 0; i < tries; i++) {
    try {
      return await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 1000 }).asPromise();
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("mongod không khởi động được");
}

async function main() {
  mkdirSync(DB_PATH, { recursive: true });
  const bin = await MongoBinary.getPath();
  const child = spawn(bin, ["--dbpath", DB_PATH, "--port", String(PORT), "--bind_ip", "127.0.0.1", "--replSet", "rs0", "--quiet"], { stdio: ["ignore", "ignore", "inherit"] });
  child.on("exit", (code) => {
    console.log(`[db:local] mongod đã dừng (code ${code}).`);
    process.exit(code ?? 0);
  });
  const stop = () => child.kill();
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  const conn = await waitForPort(`mongodb://127.0.0.1:${PORT}/?directConnection=true`);
  const admin = conn.db!.admin();
  try {
    await admin.command({ replSetGetStatus: 1 });
  } catch (err) {
    if ((err as { codeName?: string }).codeName === "NotYetInitialized") {
      await admin.command({ replSetInitiate: { _id: "rs0", members: [{ _id: 0, host: `127.0.0.1:${PORT}` }] } });
      console.log("[db:local] Đã khởi tạo replica set rs0.");
    } else throw err;
  }
  // Wait until this node is PRIMARY (writes allowed).
  for (let i = 0; i < 60; i++) {
    const hello = (await admin.command({ hello: 1 })) as { isWritablePrimary?: boolean };
    if (hello.isWritablePrimary) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  await conn.close();
  console.log(`[db:local] MongoDB sẵn sàng — dữ liệu tại ${DB_PATH}`);
  console.log(`[db:local] MONGODB_URI=mongodb://127.0.0.1:${PORT}/?replicaSet=rs0&directConnection=true`);
}

main().catch((err) => {
  console.error("[db:local] Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
