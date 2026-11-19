import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";
import { getAuthFlags } from "@/modules/auth/service";
import { AuthCard } from "../auth-card";

export const metadata: Metadata = { title: "Quên mật khẩu" };
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const { passwordResetAvailable } = getAuthFlags();
  return (
    <AuthCard title="Quên mật khẩu" description="Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.">
      <ForgotPasswordForm
        disabledReason={
          passwordResetAvailable
            ? undefined
            : "Hệ thống chưa cấu hình gửi email nên chưa thể khôi phục mật khẩu qua email. Vui lòng liên hệ quản trị viên để được cấp mật khẩu tạm thời."
        }
      />
    </AuthCard>
  );
}
