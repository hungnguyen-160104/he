import type { Metadata } from "next";
import Link from "next/link";
import { CheckSquare, FolderTree, ShieldCheck, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/states";
import { requirePageActor } from "@/lib/auth/session";
import { getConfigStatus } from "@/lib/env";
import { adminUserCounts } from "@/modules/users/service";
import { listManagedExams } from "@/modules/exams/service";
import { listQuestionReviewQueue } from "@/modules/questions/service";
import { adminListCampaigns } from "@/modules/rankings/service";

export const metadata: Metadata = { title: "Quản trị hệ thống" };
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const actor = await requirePageActor(["ADMIN"]);
  const [counts, pendingExams, pendingQuestions, campaigns] = await Promise.all([
    adminUserCounts(actor),
    listManagedExams(actor, { page: 1, limit: 1, status: "PENDING_REVIEW" }),
    listQuestionReviewQueue(actor, { page: 1, limit: 1 }),
    adminListCampaigns(actor),
  ]);
  const needFinalize = campaigns.filter((c) => c.canFinalize).length;
  const config = getConfigStatus();

  const stats = [
    { label: "Học sinh", value: counts.STUDENT },
    { label: "Giáo viên", value: counts.TEACHER },
    { label: "Quản trị viên", value: counts.ADMIN },
    { label: "Tài khoản bị khóa", value: counts.SUSPENDED },
    { label: "Đề chờ duyệt", value: pendingExams.total },
    { label: "Câu hỏi chờ duyệt", value: pendingQuestions.total },
    { label: "Kỳ xếp hạng cần chốt", value: needFinalize },
    { label: "Kỳ đang diễn ra", value: campaigns.filter((c) => c.isLive).length },
  ];
  const links = [
    { href: "/quan-tri/nguoi-dung", label: "Người dùng & giáo viên", icon: Users },
    { href: "/quan-tri/duyet-de", label: "Duyệt đề", icon: CheckSquare },
    { href: "/quan-tri/mon-hoc", label: "Môn học & chủ đề", icon: FolderTree },
    { href: "/quan-tri/xep-hang", label: "Kỳ xếp hạng", icon: Trophy },
    { href: "/quan-tri/nhat-ky", label: "Nhật ký hệ thống", icon: ShieldCheck },
  ];
  const integrations = [
    { label: "Cơ sở dữ liệu", ok: config.database },
    { label: "Cloudinary (ảnh)", ok: config.cloudinary },
    { label: `Email (${config.mailProvider})`, ok: config.mail },
    { label: "Bắt buộc xác minh email", ok: config.requireEmailVerification },
  ];

  return (
    <>
      <PageHeader title="Quản trị hệ thống" description={`Xin chào, ${actor.displayName}.`} />
      <section aria-label="Thống kê tài khoản" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Lối tắt</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent">
                <Icon className="size-4 text-primary" aria-hidden="true" /> {label}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cấu hình tích hợp</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-2 text-sm">
              {integrations.map((i) => (
                <li key={i.label} className="flex items-center justify-between gap-2">
                  <span>{i.label}</span>
                  <span className={i.ok ? "font-medium text-success" : "text-muted-foreground"}>{i.ok ? "Đã bật" : "Chưa cấu hình / tắt"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
