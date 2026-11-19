import type { Metadata } from "next";
import Link from "next/link";
import { ListPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/common/states";
import { DemoBadge, StatusBadge } from "@/components/common/status-badges";
import { PaginationLinks, firstString } from "@/components/common/pagination-links";
import { requirePageActor } from "@/lib/auth/session";
import { formatDateTimeVN } from "@/lib/utils/format";
import { adminListSubjects } from "@/modules/subjects/service";
import { listManagedQuestions } from "@/modules/questions/service";
import { DIFFICULTY_LABELS, QUESTION_STATUSES, QUESTION_STATUS_LABELS, QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionStatus, type QuestionType } from "@/modules/questions/types";

export const metadata: Metadata = { title: "Ngân hàng câu hỏi" };
export const dynamic = "force-dynamic";

const selectClass = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-9 sm:w-auto";

export default async function QuestionsPage(props: PageProps<"/giao-vien/cau-hoi">) {
  const actor = await requirePageActor(["TEACHER", "ADMIN"]);
  const sp = await props.searchParams;
  const page = Math.max(1, Number(firstString(sp.page) ?? 1) || 1);
  const subjectId = /^[a-f0-9]{24}$/i.test(firstString(sp.subjectId) ?? "") ? firstString(sp.subjectId) : undefined;
  const type = (QUESTION_TYPES as readonly string[]).includes(firstString(sp.type) ?? "") ? (firstString(sp.type) as QuestionType) : undefined;
  const status = (QUESTION_STATUSES as readonly string[]).includes(firstString(sp.status) ?? "") ? (firstString(sp.status) as QuestionStatus) : undefined;
  const q = firstString(sp.q)?.slice(0, 100);
  const mine = firstString(sp.mine) === "1";
  const [subjects, { items, total }] = await Promise.all([
    adminListSubjects(actor),
    listManagedQuestions(actor, { page, limit: 20, subjectId, type, status, q, mine }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / 20));
  return (
    <>
      <PageHeader
        title="Ngân hàng câu hỏi"
        description={actor.role === "ADMIN" ? "Quản trị viên xem được tất cả câu hỏi." : "Các câu hỏi do bạn soạn."}
        actions={<Button asChild><Link href="/giao-vien/cau-hoi/moi"><ListPlus className="size-4" />Tạo câu hỏi</Link></Button>}
      />
      <form method="get" className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="search" aria-label="Lọc câu hỏi">
        <Input name="q" defaultValue={q ?? ""} placeholder="Tìm trong đề bài…" aria-label="Tìm trong đề bài" className="col-span-2 w-full sm:w-56" />
        <select name="subjectId" defaultValue={subjectId ?? ""} aria-label="Môn" className={selectClass}>
          <option value="">Tất cả môn</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="type" defaultValue={type ?? ""} aria-label="Dạng" className={selectClass}>
          <option value="">Mọi dạng</option>
          {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} aria-label="Trạng thái" className={`col-span-2 ${selectClass}`}>
          <option value="">Mọi trạng thái (trừ lưu trữ)</option>
          {QUESTION_STATUSES.map((s) => <option key={s} value={s}>{QUESTION_STATUS_LABELS[s]}</option>)}
        </select>
        {actor.role === "ADMIN" ? <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="mine" value="1" defaultChecked={mine} className="size-4" />Chỉ của tôi</label> : null}
        <Button type="submit" variant="outline" className={actor.role === "ADMIN" ? undefined : "col-span-2 sm:col-auto"}><Search className="size-4" />Lọc</Button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="Chưa có câu hỏi" description="Tạo câu hỏi đầu tiên hoặc thay đổi bộ lọc." action={<Button asChild><Link href="/giao-vien/cau-hoi/moi">Tạo câu hỏi</Link></Button>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Câu hỏi</TableHead>
                <TableHead className="hidden md:table-cell">Môn · Dạng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-md">
                    <Link href={`/giao-vien/cau-hoi/${r.id}`} className="line-clamp-2 font-medium text-primary hover:underline">{r.stemPreview || "(trống)"}</Link>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      <Badge variant="outline">{DIFFICULTY_LABELS[r.difficulty]}</Badge>
                      <DemoBadge show={r.isDemo} />
                      {actor.role === "ADMIN" && r.ownerName ? <span>· {r.ownerName}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{r.subjectName}<br /><span className="text-muted-foreground">{QUESTION_TYPE_LABELS[r.type]}</span></TableCell>
                  <TableCell><StatusBadge kind="question" status={r.status} /></TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">{formatDateTimeVN(r.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationLinks basePath="/giao-vien/cau-hoi" page={page} totalPages={totalPages} params={{ subjectId, type, status, q, mine: mine ? "1" : undefined }} />
    </>
  );
}
