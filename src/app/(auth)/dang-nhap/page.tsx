import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { ConfigMissingNotice } from "@/components/common/states";
import { getActor } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/security/origin";
import { AuthCard } from "../auth-card";

export const metadata: Metadata = { title: "Đăng nhập" };
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  registered: "Tạo tài khoản thành công. Vui lòng đăng nhập.",
  verify: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.",
  verified: "Xác minh email thành công. Bạn có thể đăng nhập.",
  password_changed: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
};

export default async function LoginPage(props: PageProps<"/dang-nhap">) {
  const sp = await props.searchParams;
  const callbackUrl = safeRedirectPath(typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined, "/sau-dang-nhap");
  const actor = await getActor().catch(() => null);
  if (actor) redirect(callbackUrl);
  const notice = typeof sp.notice === "string" ? NOTICES[sp.notice] : undefined;
  return (
    <AuthCard title="Đăng nhập" description="Dùng tên đăng nhập hoặc email đã đăng ký.">
      {!isDatabaseConfigured() ? (
        <div className="mb-4">
          <ConfigMissingNotice what="cơ sở dữ liệu" hint="Chưa thể đăng nhập cho đến khi quản trị viên cấu hình MONGODB_URI." />
        </div>
      ) : null}
      <LoginForm callbackUrl={callbackUrl} notice={notice} />
    </AuthCard>
  );
}
