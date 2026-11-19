import type { Metadata } from "next";
import { VerifyEmail } from "@/components/auth/verify-email";
import { AuthCard } from "../auth-card";

export const metadata: Metadata = { title: "Xác minh email" };

export default async function VerifyEmailPage(props: PageProps<"/xac-minh-email">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" && /^[A-Za-z0-9_-]{20,200}$/.test(sp.token) ? sp.token : null;
  return (
    <AuthCard title="Xác minh email">
      <VerifyEmail token={token} />
    </AuthCard>
  );
}
