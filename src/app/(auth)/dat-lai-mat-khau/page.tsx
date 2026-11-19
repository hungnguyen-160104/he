import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";
import { AuthCard } from "../auth-card";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default async function ResetPasswordPage(props: PageProps<"/dat-lai-mat-khau">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" && /^[A-Za-z0-9_-]{20,200}$/.test(sp.token) ? sp.token : null;
  return (
    <AuthCard title="Đặt lại mật khẩu" description="Chọn mật khẩu mới cho tài khoản của bạn.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
