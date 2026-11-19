/**
 * E2E harness: starts an in-memory MongoDB replica set (transactions supported) and runs the
 * production Next.js server against it. Never touches a real/production database.
 * Requires `pnpm build` first. Used by playwright.config.ts `webServer`.
 */
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const PORT = process.env.E2E_PORT ?? "3100";
// Test-only credential for the throwaway in-memory database.
const E2E_ADMIN_PASSWORD = "E2E quan tri 2026";

async function main() {
  // Each run uses a brand-new in-memory database: drop Next's data cache (unstable_cache entries)
  // from the previous run so cached catalog pages never point at ids that no longer exist.
  const fetchCache = path.join(process.cwd(), ".next", "cache", "fetch-cache");
  if (existsSync(fetchCache)) rmSync(fetchCache, { recursive: true, force: true });

  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  const uri = replSet.getUri();
  console.log(`[e2e] in-memory MongoDB ready`);

  // NOTE: must be async — a blocking spawnSync would stall this event loop, which also drains the
  // in-memory mongod's output pipes, and mongod would hang under load.
  const run = (script: string, env: Record<string, string>, extra: string[] = []) =>
    new Promise<number>((resolve) => {
      const p = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["run", "-s", script, "--yes", ...extra], {
        stdio: "inherit",
        shell: process.platform === "win32",
        env: { ...process.env, MONGODB_URI: uri, MONGODB_DB_NAME: "examhub_e2e", UNLIMITED_MODE: "false", ...env },
      });
      p.on("exit", (code) => resolve(code ?? 1));
    });

  // Bootstrap the E2E admin through the real script (also exercises `pnpm bootstrap:admin`).
  if ((await run("bootstrap:admin", { ADMIN_USERNAME: "e2e_admin", ADMIN_EMAIL: "e2e_admin@example.com", ADMIN_PASSWORD: E2E_ADMIN_PASSWORD })) !== 0) {
    throw new Error("bootstrap:admin failed");
  }
  // DEMO content through the real seed script (subjects, rules, approved questions, exams, weekly campaign).
  if ((await run("seed:demo", {}, ["--profile", "e2e"])) !== 0) throw new Error("seed:demo failed");

  const child = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["exec", "next", "start", "-p", PORT], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      NODE_ENV: "production",
      MONGODB_URI: uri,
      MONGODB_DB_NAME: "examhub_e2e",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-only-secret-not-for-production-0123456789",
      NEXTAUTH_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
      MAIL_PROVIDER: "none",
      REQUIRE_EMAIL_VERIFICATION: "false",
      // All E2E browsers share one IP; scale limits so the suite is not throttled (limits stay enforced).
      RATE_LIMIT_MULTIPLIER: "20",
      // .env.local may enable UNLIMITED_MODE for local testing; E2E must test the real limits.
      UNLIMITED_MODE: "false",
    },
  });

  const shutdown = async () => {
    child.kill();
    await replSet.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  child.on("exit", async (code) => {
    await replSet.stop();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("[e2e] failed to start", err instanceof Error ? err.message : err);
  process.exit(1);
});
