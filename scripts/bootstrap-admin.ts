/**
 * pnpm bootstrap:admin [--username u] [--email e] [--display-name n] [--promote] [--yes]
 *
 * Creates the first ADMIN account. Idempotent:
 *  - an ADMIN with that username/email already exists → nothing changes;
 *  - a non-admin account exists → only promoted when --promote is given (audited).
 * Password comes from ADMIN_PASSWORD env or a hidden prompt; it is never printed or logged.
 * Non-local / production databases require typing a confirmation (or --yes).
 */
import { parseArgs } from "node:util";
import { confirmDangerousTarget, loadLocalEnv, prompt } from "./lib/script-env";

loadLocalEnv();

async function main() {
  const { values } = parseArgs({
    options: {
      username: { type: "string" },
      email: { type: "string" },
      "display-name": { type: "string" },
      promote: { type: "boolean", default: false },
      yes: { type: "boolean", default: false },
      // DEV ONLY: allow a weak temporary password on a LOCAL, non-production database.
      "allow-weak-password": { type: "boolean", default: false },
    },
  });

  const [{ resetEnvCache }, { connectToDatabase, disconnectFromDatabase }, validation, { hashPassword }, { UserModel }, { writeAudit }] =
    await Promise.all([
      import("@/lib/env"),
      import("@/lib/mongodb/connection"),
      import("@/modules/auth/validation"),
      import("@/modules/auth/password"),
      import("@/modules/users/model"),
      import("@/modules/audit/service"),
    ]);
  resetEnvCache();
  if (!process.env.MONGODB_URI) {
    console.error("Thiếu MONGODB_URI (đặt trong .env.local hoặc biến môi trường).");
    process.exit(1);
  }

  const username = validation.usernameSchema.parse(values.username ?? process.env.ADMIN_USERNAME ?? (await prompt("Tên đăng nhập admin: ")));
  const email = validation.emailSchema.parse(values.email ?? process.env.ADMIN_EMAIL ?? (await prompt("Email admin: ")));
  const displayName = validation.displayNameSchema.parse(values["display-name"] ?? process.env.ADMIN_DISPLAY_NAME ?? "Quản trị viên");

  await confirmDangerousTarget("tạo/nâng quyền quản trị viên", values.yes);
  await connectToDatabase();
  await UserModel.init();

  const existing = await UserModel.findOne({ $or: [{ usernameNormalized: username }, { emailNormalized: email }] }, { role: 1, username: 1 }).lean();
  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`Đã có quản trị viên @${existing.username}. Không thay đổi gì.`);
    } else if (values.promote) {
      await UserModel.updateOne({ _id: existing._id }, { $set: { role: "ADMIN" }, $inc: { sessionVersion: 1 } });
      await writeAudit({ actorId: null, action: "ADMIN_BOOTSTRAPPED", entityType: "User", entityId: existing._id, metadata: { mode: "promote" } });
      console.log(`Đã nâng @${existing.username} lên quản trị viên.`);
    } else {
      console.error(`Tài khoản @${existing.username} (hoặc email) đã tồn tại với vai trò ${existing.role}. Dùng --promote để nâng quyền.`);
      process.exitCode = 1;
    }
    await disconnectFromDatabase();
    return;
  }

  const password = process.env.ADMIN_PASSWORD ?? (await prompt("Mật khẩu admin (ẩn): ", { hidden: true }));
  const weak = validation.checkPasswordStrength(password, { username, email });
  if (weak) {
    const { describeMongoTarget } = await import("./lib/script-env");
    const local = describeMongoTarget(process.env.MONGODB_URI).isLocal && process.env.NODE_ENV !== "production";
    if (!values["allow-weak-password"] || !local) {
      console.error(`Mật khẩu không đạt yêu cầu: ${weak}`);
      if (values["allow-weak-password"]) console.error("--allow-weak-password chỉ được dùng với database local (không phải production).");
      process.exit(1);
    }
    console.warn("⚠ Đang dùng mật khẩu YẾU tạm thời (chỉ cho môi trường local). Hãy đổi mật khẩu trong trang Hồ sơ trước khi dùng thật.");
  }
  const doc = await UserModel.create({
    username,
    usernameNormalized: username,
    email,
    emailNormalized: email,
    passwordHash: await hashPassword(password),
    role: "ADMIN",
    status: "ACTIVE",
    displayName,
    // Not marked as verified: we have not verified the email (spec §3.2).
    emailVerifiedAt: null,
  });
  await writeAudit({ actorId: null, action: "ADMIN_BOOTSTRAPPED", entityType: "User", entityId: doc._id, metadata: { mode: "create" } });
  console.log(`Đã tạo quản trị viên @${username}. Đăng nhập tại /dang-nhap.`);
  await disconnectFromDatabase();
}

main().catch((err) => {
  console.error("Lỗi:", err instanceof Error ? err.message.split("\n")[0] : err);
  process.exit(1);
});
