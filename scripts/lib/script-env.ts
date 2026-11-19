import { existsSync } from "node:fs";
import readline from "node:readline/promises";
import { Writable } from "node:stream";

/** Load .env.local (if present) like Next.js does; real env vars take precedence. */
export function loadLocalEnv(file = ".env.local"): void {
  if (existsSync(file)) process.loadEnvFile(file);
}

/** Describe the DB target without credentials. */
export function describeMongoTarget(uri: string | undefined): { host: string; isLocal: boolean } {
  if (!uri) return { host: "(chưa cấu hình)", isLocal: false };
  const m = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?([^/?]+)/);
  const host = m?.[1] ?? "unknown";
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(,|$)/.test(host);
  return { host, isLocal };
}

export async function prompt(question: string, opts: { hidden?: boolean } = {}): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  const pending = rl.question(question);
  muted = Boolean(opts.hidden);
  const answer = await pending;
  muted = false;
  rl.close();
  if (opts.hidden) process.stdout.write("\n");
  return answer;
}

/** Non-local or production targets require typing the confirmation word (or --yes). */
export async function confirmDangerousTarget(action: string, assumeYes: boolean): Promise<void> {
  const { host, isLocal } = describeMongoTarget(process.env.MONGODB_URI);
  const isProd = process.env.NODE_ENV === "production";
  console.log(`Mục tiêu MongoDB: ${host} / database: ${process.env.MONGODB_DB_NAME ?? "examhub"}`);
  if (isLocal && !isProd) return;
  if (assumeYes) {
    console.log(`(--yes) Bỏ qua xác nhận cho: ${action}`);
    return;
  }
  const answer = await prompt(`⚠ Đây không phải database local. Gõ "XAC NHAN" để ${action}: `);
  if (answer.trim() !== "XAC NHAN") {
    console.log("Đã hủy.");
    process.exit(1);
  }
}
