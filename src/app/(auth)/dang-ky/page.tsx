import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { ConfigMissingNotice } from "@/components/common/states";
import { FormMessage } from "@/components/forms/field";
import { isDatabaseConfigured } from "@/lib/env";
import { getAuthFlags } from "@/modules/auth/service";
import { AuthCard } from "../auth-card";

export const metadata: Metadata = { title: "Đăng ký" };
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const flags = getAuthFlags();
  const dbReady = isDatabaseConfigured();
  return (
    <AuthCard title="Tạo tài khoản học sinh" description="Tài khoản giáo viên do quản trị viên cấp.">
      <div className="grid grid-cols-1 gap-4">
        {!dbReady ? <ConfigMissingNotice what="cơ sở dữ liệu" hint="Chưa thể đăng ký cho đến khi quản trị viên cấu hình MONGODB_URI." /> : null}
        {flags.devWarning ? (
          <FormMessage kind="info">Môi trường phát triển: không yêu cầu xác minh email (REQUIRE_EMAIL_VERIFICATION=false).</FormMessage>
        ) : null}
        <RegisterForm
          disabledReason={
            flags.registrationOpen
              ? undefined
              : "Đăng ký tạm thời đóng vì hệ thống chưa cấu hình gửi email xác minh. Vui lòng liên hệ quản trị viên."
          }
        />
      </div>
    </AuthCard>
  );
}
