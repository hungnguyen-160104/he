import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/common/states";
import { DemoBadge, StatusBadge } from "@/components/common/status-badges";
import { PaginationLinks, firstString } from "@/components/common/pagination-links";
import { requirePageActor } from "@/lib/auth/session";
import { formatDateTimeVN } from "@/lib/utils/format";
import { listManagedExams } from "@/modules/exams/service";
import { EXAM_MODE_LABELS, EXAM_STATUSES, EXAM_STATUS_LABELS, type ExamStatus } from "@/modules/exams/validation";

export const metadata: Metadata = { title: "Đề thi của tôi" };
const chip = "inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3";
const chipActive = "border-primary bg-accent font-semibold text-accent-foreground";
const chipIdle = "bg-card text-muted-foreground hover:bg-accent";

export const dynamic = "force-dynamic";

export default async function TeacherExamsPage(props: PageProps<"/giao-vien/de-thi">) {
  const actor = await requirePageActor(["TEACHER", "ADMIN"]);
  const sp = await props.searchParams;
  const page = Math.max(1, Number(firstString(sp.page) ?? 1) || 1);
  const status = (EXAM_STATUSES as readonly string[]).includes(firstString(sp.status) ?? "") ? (firstString(sp.status) as ExamStatus) : undefined;
  const { items, total } = await listManagedExams(actor, { page, limit: 20, status });
  return (
    <>
      <PageHeader title="Đề thi" description="Soạn đề nháp, gửi duyệt; đề đã xuất bản không sửa trực tiếp (hãy nhân bản)." actions={<Button asChild><Link href="/giao-vien/de-thi/moi"><FilePlus2 className="size-4" />Tạo đề</Link></Button>} />
      <nav aria-label="Lọc trạng thái" className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 text-sm sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href="/giao-vien/de-thi" aria-current={!status ? "page" : undefined} className={`${chip} ${!status ? chipActive : chipIdle}`}>Tất cả</Link>
        {EXAM_STATUSES.map((s) => <Link key={s} href={`/giao-vien/de-thi?status=${s}`} aria-current={status === s ? "page" : undefined} className={`${chip} ${status === s ? chipActive : chipIdle}`}>{EXAM_STATUS_LABELS[s]}</Link>)}
      </nav>
      {items.length === 0 ? (
        <EmptyState title="Chưa có đề" action={<Button asChild><Link href="/giao-vien/de-thi/moi">Tạo đề đầu tiên</Link></Button>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Đề</TableHead><TableHead className="hidden md:table-cell">Môn</TableHead><TableHead>Trạng thái</TableHead><TableHead className="hidden lg:table-cell">Cập nhật</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link href={`/giao-vien/de-thi/${e.id}`} className="font-medium text-primary hover:underline">{e.title}</Link>
                    <div className="text-xs text-muted-foreground">{EXAM_MODE_LABELS[e.mode]} · {e.itemCount} câu{actor.role === "ADMIN" && e.ownerName ? ` · ${e.ownerName}` : ""} <DemoBadge show={e.isDemo} /></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{e.subjectName}</TableCell>
                  <TableCell><StatusBadge kind="exam" status={e.status} /></TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">{formatDateTimeVN(e.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationLinks basePath="/giao-vien/de-thi" page={page} totalPages={Math.max(1, Math.ceil(total / 20))} params={{ status }} />
    </>
  );
}
