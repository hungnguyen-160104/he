import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/states";
import { QuestionContent } from "@/components/questions/question-content";
import { AnswerKey, Explanation } from "@/components/questions/answer-key";
import { ReviewActions } from "@/components/admin/review-actions";
import { requirePageActor } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import { formatMinutes } from "@/lib/utils/format";
import { getExamForReview } from "@/modules/exams/service";
import { EXAM_MODE_LABELS } from "@/modules/exams/validation";

export const metadata: Metadata = { title: "Duyệt đề" };
export const dynamic = "force-dynamic";

export default async function ExamReviewPage(props: PageProps<"/quan-tri/duyet-de/[id]">) {
  const actor = await requirePageActor(["ADMIN"]);
  const { id } = await props.params;
  let exam;
  try {
    exam = await getExamForReview(actor, id);
  } catch (err) {
    if (isAppError(err) && err.status === 404) notFound();
    throw err;
  }
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/quan-tri/duyet-de" className="text-primary hover:underline">← Danh sách chờ duyệt</Link></p>
      <PageHeader
        title={exam.title}
        description={`${exam.subjectName} · ${EXAM_MODE_LABELS[exam.mode]} · ${formatMinutes(exam.durationMinutes)} · ${exam.items.length} câu · tổng điểm thô ${exam.totalMaxRawPoints} · ${exam.ownerName}`}
        actions={<ReviewActions kind="exam" id={exam.id} onDoneHref="/quan-tri/duyet-de" />}
      />
      <ol className="grid grid-cols-1 gap-4">
        {exam.items.map((it, i) => (
          <li key={it.itemId}>
            <Card>
              <CardHeader><CardTitle className="text-base">Câu {i + 1} · Phần {it.sectionId} · tối đa {it.maxPoints} điểm</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <QuestionContent view={it.view} />
                <AnswerKey type={it.view.type} answer={it.key} />
                <Explanation text={it.explanation} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
