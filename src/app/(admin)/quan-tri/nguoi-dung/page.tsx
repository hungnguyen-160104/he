import type { Metadata } from "next";
import { PageHeader } from "@/components/common/states";
import { UsersManager } from "@/components/admin/users-manager";
import { requirePageActor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Người dùng" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const actor = await requirePageActor(["ADMIN"]);
  return (
    <>
      <PageHeader title="Người dùng" description="Quản lý học sinh, giáo viên, trạng thái và vai trò tài khoản." />
      <UsersManager currentUserId={actor.id} />
    </>
  );
}
