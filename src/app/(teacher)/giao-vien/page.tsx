import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/states";
import { requirePageActor } from "@/lib/auth/session";
import { listManagedExams } from "@/modules/exams/service";
import { teacherQuestionCounts } from "@/modules/questions/service";
import { QUESTION_STATUS_LABELS, QUESTION_STATUSES } from "@/modules/questions/types";
import { EXAM_STATUS_LABELS, EXAM_STATUSES } from "@/modules/exams/validation";

export const metadata: Metadata = { title: "Khu vực giáo viên" };
export const dynamic = "force-dynamic";

export default async function TeacherHomePage() {
  const actor = await requirePageActor(["TEACHER", "ADMIN"]);
  const [qCounts, ...examLists] = await Promise.all([
    teacherQuestionCounts(actor),
    ...EXAM_STATUSES.map((status) => listManagedExams(actor, { page: 1, limit: 1, status, mine: true })),
  ]);
  return (
    <>
      <PageHeader
        title={`Xin chào, ${actor.displayName}`}
        description="Soạn câu hỏi, xây dựng đề và gửi quản trị viên duyệt."
        actions={
          <>
            <Button asChild><Link href="/giao-vien/cau-hoi/moi"><ListPlus className="size-4" />Tạo câu hỏi</Link></Button>
            <Button asChild variant="outline"><Link href="/giao-vien/de-thi/moi"><FilePlus2 className="size-4" />Tạo đề</Link></Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Câu hỏi của tôi</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUESTION_STATUSES.map((s) => (
              <Link key={s} href={`/giao-vien/cau-hoi?status=${s}`} className="rounded-md border p-3 hover:bg-accent">
                <p className="text-sm text-muted-foreground">{QUESTION_STATUS_LABELS[s]}</p>
                <p className="text-2xl font-semibold tabular-nums">{qCounts[s]}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Đề thi của tôi</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {EXAM_STATUSES.map((s, i) => (
              <Link key={s} href={`/giao-vien/de-thi?status=${s}`} className="rounded-md border p-3 hover:bg-accent">
                <p className="text-sm text-muted-foreground">{EXAM_STATUS_LABELS[s]}</p>
                <p className="text-2xl font-semibold tabular-nums">{examLists[i]!.total}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
