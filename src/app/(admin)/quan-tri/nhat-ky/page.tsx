import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/common/states";
import { requirePageActor } from "@/lib/auth/session";
import { paginationSchema } from "@/lib/validation/common";
import { formatDateTimeVN } from "@/lib/utils/format";
import { listAuditLogs } from "@/modules/audit/service";

export const metadata: Metadata = { title: "Nhật ký hệ thống" };
export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  USER_REGISTERED: "Đăng ký tài khoản",
  TEACHER_CREATED: "Tạo giáo viên",
  USER_STATUS_CHANGED: "Đổi trạng thái tài khoản",
  USER_ROLE_CHANGED: "Đổi vai trò",
  USER_PASSWORD_RESET_BY_ADMIN: "Cấp mật khẩu tạm",
  PASSWORD_CHANGED: "Đổi mật khẩu",
  PASSWORD_RESET: "Đặt lại mật khẩu",
  EMAIL_VERIFIED: "Xác minh email",
  ADMIN_BOOTSTRAPPED: "Khởi tạo quản trị viên",
  SUBJECT_CREATED: "Tạo môn học",
  SUBJECT_UPDATED: "Sửa môn học",
  TOPIC_CREATED: "Tạo chủ đề",
  TOPIC_UPDATED: "Sửa chủ đề",
  QUESTION_SUBMITTED: "Gửi duyệt câu hỏi",
  QUESTION_APPROVED: "Duyệt câu hỏi",
  QUESTION_REJECTED: "Từ chối câu hỏi",
  QUESTION_ARCHIVED: "Lưu trữ câu hỏi",
  SCORING_RULE_CREATED: "Tạo quy tắc tính điểm",
  SCORING_RULE_PUBLISHED: "Xuất bản quy tắc tính điểm",
  EXAM_SUBMITTED: "Gửi duyệt đề",
  EXAM_APPROVED: "Duyệt/xuất bản đề",
  EXAM_REJECTED: "Từ chối đề",
  EXAM_UNPUBLISHED: "Gỡ xuất bản đề",
  EXAM_ARCHIVED: "Lưu trữ đề",
  CAMPAIGN_CREATED: "Tạo kỳ xếp hạng",
  CAMPAIGN_ACTIVATED: "Kích hoạt kỳ xếp hạng",
  CAMPAIGN_FINALIZED: "Chốt kỳ xếp hạng",
  ATTEMPTS_RECONCILED: "Chốt bài hết giờ",
  DEMO_SEEDED: "Tạo dữ liệu DEMO",
  DEMO_REMOVED: "Xóa dữ liệu DEMO",
};

export default async function AuditLogPage(props: PageProps<"/quan-tri/nhat-ky">) {
  await requirePageActor(["ADMIN"]);
  const sp = await props.searchParams;
  const p = paginationSchema.catch({ page: 1, limit: 20 }).parse({ page: sp.page, limit: 30 });
  const { items, total } = await listAuditLogs(p);
  const totalPages = Math.max(1, Math.ceil(total / p.limit));

  return (
    <>
      <PageHeader title="Nhật ký hệ thống" description="Các thao tác quản trị và bảo mật đã được ghi lại (không chứa mật khẩu hay mã xác thực)." />
      {items.length === 0 ? (
        <EmptyState title="Chưa có nhật ký" />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead className="hidden md:table-cell">Đối tượng</TableHead>
                <TableHead className="hidden lg:table-cell">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDateTimeVN(l.createdAt)}</TableCell>
                  <TableCell>{l.actorName ?? "Hệ thống"}</TableCell>
                  <TableCell>{ACTION_LABELS[l.action] ?? l.action}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {l.entityType} {l.entityId ? `#${l.entityId.slice(-6)}` : ""}
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate font-mono text-xs text-muted-foreground lg:table-cell">
                    {Object.keys(l.metadata).length ? JSON.stringify(l.metadata) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {totalPages > 1 ? (
        <nav aria-label="Phân trang" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trang {p.page}/{totalPages}</span>
          <div className="flex gap-2">
            {p.page > 1 ? (
              <Button asChild variant="outline" size="sm"><Link href={`?page=${p.page - 1}`}>Trước</Link></Button>
            ) : null}
            {p.page < totalPages ? (
              <Button asChild variant="outline" size="sm"><Link href={`?page=${p.page + 1}`}>Sau</Link></Button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
