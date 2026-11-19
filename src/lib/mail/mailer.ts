import "server-only";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type MailMessage = { to: string; subject: string; text: string };

/**
 * Mail adapter. Never pretends to send:
 * - none    → isConfigured=false; callers disable email-dependent flows with a clear message.
 * - console → development only (env validation forbids it in production); prints the message.
 * - resend  → Resend HTTP API. NOT VERIFIED until a real key + verified domain are configured.
 */
export function isMailConfigured(): boolean {
  return getEnv().MAIL_PROVIDER !== "none";
}

export async function sendMail(msg: MailMessage): Promise<void> {
  const env = getEnv();
  if (env.MAIL_PROVIDER === "none") throw new Error("MAIL_NOT_CONFIGURED");

  if (env.MAIL_PROVIDER === "console") {
    console.info(`\n[DEV MAIL — không gửi thật]\nTo: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    logger.error("mail.send_failed", { provider: "resend", status: res.status });
    throw new Error("MAIL_SEND_FAILED");
  }
}
