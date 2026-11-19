import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badges";
import { PaginationLinks, firstString } from "@/components/common/pagination-links";
import { requirePageActor } from "@/lib/auth/session";
import { getPublicSubjects, safePublic } from "@/lib/cache/public-data";
import { formatDateTimeVN, formatScoreScaled } from "@/lib/utils/format";
import { listMyAttempts } from "@/modules/attempts/service";

export const metadata: Metadata = { title: "Lịch sử làm bài" };
export const dynamic = "force-dynamic";

const selectClass = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-9 sm:w-auto";

export default async function HistoryPage(props: PageProps<"/lich-su">) {
  const actor = await requirePageActor();
  const sp = await props.searchParams;
  const page = Math.max(1, Number(firstString(sp.page) ?? 1) || 1);
  const subjectId = /^[a-f0-9]{24}$/i.test(firstString(sp.subjectId) ?? "") ? firstString(sp.subjectId) : undefined;
  const mode = firstString(sp.mode) === "MOCK" || firstString(sp.mode) === "PRACTICE" ? (firstString(sp.mode) as "MOCK" | "PRACTICE") : undefined;
  const [subjects, { items, total }] = await Promise.all([safePublic(() => getPublicSubjects()), listMyAttempts(actor, { page, limit: 20, subjectId, mode })]);
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <PageHeader title="Lịch sử làm bài" description="Tất cả lượt luyện tập và thi thử của bạn, kể cả các lần làm lại." />
      <form method="get" className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Lọc lịch sử">
        <select name="subjectId" defaultValue={subjectId ?? ""} aria-label="Môn học" className={selectClass}>
          <option value="">Tất cả môn</option>
          {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="mode" defaultValue={mode ?? ""} aria-label="Hình thức" className={selectClass}>
          <option value="">Mọi hình thức</option>
          <option value="MOCK">Thi thử</option>
          <option value="PRACTICE">Luyện tập</option>
        </select>
        <Button type="submit" variant="outline" className="col-span-2 sm:col-auto">Lọc</Button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="Chưa có lượt làm bài" description="Hãy bắt đầu luyện tập hoặc làm một đề thi thử." action={<Button asChild><Link href="/luyen-tap">Bắt đầu luyện tập</Link></Button>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài làm</TableHead>
                <TableHead className="hidden sm:table-cell">Bắt đầu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={a.status === "IN_PROGRESS" ? `/lam-bai/${a.id}` : `/ket-qua/${a.id}`} className="font-medium text-primary hover:underline">{a.title}</Link>
                    <div className="text-xs text-muted-foreground">
                      {a.subjectName} · {a.totalItems} câu · {a.mode === "MOCK" ? "Thi thử" : "Luyện tập"}
                      {a.kind === "EXAM" ? (a.isFirstRankedAttempt ? " · Lượt đầu" : " · Làm lại") : ""}
                    </div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm sm:table-cell">{formatDateTimeVN(a.startedAt)}</TableCell>
                  <TableCell className="whitespace-nowrap"><StatusBadge kind="attempt" status={a.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{a.scoreScaled !== null ? formatScoreScaled(a.scoreScaled) : a.status === "IN_PROGRESS" ? <Link href={`/lam-bai/${a.id}`} className="text-sm text-primary hover:underline">Tiếp tục</Link> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationLinks basePath="/lich-su" page={page} totalPages={totalPages} params={{ subjectId, mode }} />
    </>
  );
}
