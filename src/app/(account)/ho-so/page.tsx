import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/states";
import { FormMessage } from "@/components/forms/field";
import { ChangePasswordForm, LogoutButton, ProfileForm } from "@/components/account/profile-forms";
import { requirePageActor } from "@/lib/auth/session";
import { formatDateVN } from "@/lib/utils/format";
import { ROLE_LABELS } from "@/modules/users/roles";
import { getProfile } from "@/modules/users/service";

export const metadata: Metadata = { title: "Hồ sơ" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const actor = await requirePageActor(undefined, { allowMustChangePassword: true });
  const profile = await getProfile(actor);

  return (
    <>
      <PageHeader title="Hồ sơ" description="Thông tin tài khoản, biệt danh và quyền hiển thị." actions={<LogoutButton />} />
      {profile.mustChangePassword ? (
        <div className="mb-6">
          <FormMessage kind="error">Bạn đang dùng mật khẩu tạm thời do quản trị viên cấp. Vui lòng đổi mật khẩu để tiếp tục sử dụng hệ thống.</FormMessage>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
            <CardDescription>Tên đăng nhập và email không thể tự thay đổi.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Tên đăng nhập</dt>
              <dd className="font-medium break-all">{profile.username}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">
                {profile.email}{" "}
                {profile.emailVerified ? <Badge variant="secondary">Đã xác minh</Badge> : <Badge variant="outline">Chưa xác minh</Badge>}
              </dd>
              <dt className="text-muted-foreground">Vai trò</dt>
              <dd>{ROLE_LABELS[profile.role]}</dd>
              <dt className="text-muted-foreground">Ngày tạo</dt>
              <dd>{formatDateVN(profile.createdAt)}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hồ sơ công khai</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              disabled={profile.mustChangePassword}
              initial={{ displayName: profile.displayName, grade: profile.grade, leaderboardVisibility: profile.leaderboardVisibility }}
            />
          </CardContent>
        </Card>
        <Card id="doi-mat-khau" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent className="max-w-md">
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
