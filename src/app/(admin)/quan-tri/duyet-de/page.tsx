import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/common/states";
import { DemoBadge } from "@/components/common/status-badges";
import { QuestionContent } from "@/components/questions/question-content";
import { AnswerKey, Explanation } from "@/components/questions/answer-key";
import { PublishedExamActions, ReviewActions } from "@/components/admin/review-actions";
import { firstString } from "@/components/common/pagination-links";
import { requirePageActor } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { formatDateTimeVN } from "@/lib/utils/format";
import { examsAwaitingManualRelease, listManagedExams } from "@/modules/exams/service";
import { listQuestionReviewQueue } from "@/modules/questions/service";
import { toStudentQuestionView } from "@/modules/questions/dto";
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/modules/questions/types";
import { EXAM_MODE_LABELS } from "@/modules/exams/validation";

export const metadata: Metadata = { title: "Duyệt đề & câu hỏi" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "exams", label: "Đề chờ duyệt" },
  { id: "questions", label: "Câu hỏi chờ duyệt" },
  { id: "published", label: "Đề đã xuất bản" },
] as const;

export default async function ReviewPage(props: PageProps<"/quan-tri/duyet-de">) {
  const actor = await requirePageActor(["ADMIN"]);
  const sp = await props.searchParams;
  const tab = TABS.find((t) => t.id === firstString(sp.tab))?.id ?? "exams";

  return (
    <>
      <PageHeader title="Duyệt đề & câu hỏi" description="Xem nội dung kèm đáp án trong khu vực quản trị an toàn, rồi duyệt hoặc từ chối có lý do." />
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Chọn danh sách">
        {TABS.map((t) => (
          <Link key={t.id} href={`/quan-tri/duyet-de?tab=${t.id}`} aria-current={t.id === tab ? "page" : undefined} className={cn("rounded-md px-4 py-2 text-sm font-medium", t.id === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === "exams" ? <PendingExams actorPromise={Promise.resolve(actor)} /> : null}
      {tab === "questions" ? <PendingQuestions actorPromise={Promise.resolve(actor)} /> : null}
      {tab === "published" ? <PublishedExams actorPromise={Promise.resolve(actor)} /> : null}
    </>
  );
}

type ActorP = { actorPromise: Promise<Awaited<ReturnType<typeof requirePageActor>>> };

async function PendingExams({ actorPromise }: ActorP) {
  const actor = await actorPromise;
  const { items } = await listManagedExams(actor, { page: 1, limit: 50, status: "PENDING_REVIEW" });
  if (!items.length) return <EmptyState title="Không có đề chờ duyệt" />;
  return (
    <ul className="grid grid-cols-1 gap-3">
      {items.map((e) => (
        <li key={e.id}>
          <Link href={`/quan-tri/duyet-de/${e.id}`} className="flex flex-col gap-1 rounded-lg border bg-card p-4 hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
            <span><span className="font-medium">{e.title}</span> <DemoBadge show={e.isDemo} /><span className="block text-sm text-muted-foreground">{e.subjectName} · {EXAM_MODE_LABELS[e.mode]} · {e.itemCount} câu · {e.ownerName}</span></span>
            <span className="text-sm text-primary">Xem & duyệt →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function PendingQuestions({ actorPromise }: ActorP) {
  const actor = await actorPromise;
  const { items } = await listQuestionReviewQueue(actor, { page: 1, limit: 30 });
  if (!items.length) return <EmptyState title="Không có câu hỏi chờ duyệt" />;
  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((q) => {
        const body = q.body as { type: string; content: unknown; key: unknown; explanation: string };
        const view = toStudentQuestionView({ type: body.type, content: body.content, media: (body.content as { media?: [] }).media ?? [] });
        return (
          <Card key={q.id}>
            <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{q.subjectName} · {QUESTION_TYPE_LABELS[q.type]}</CardTitle>
                <p className="text-sm text-muted-foreground">{q.ownerName} · v{q.versionNumber} · gửi {formatDateTimeVN(q.submittedAt)} · <Badge variant="outline">{DIFFICULTY_LABELS[q.difficulty]}</Badge></p>
              </div>
              <ReviewActions kind="question" id={q.id} />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <QuestionContent view={view} />
              <AnswerKey type={body.type} answer={body.key} />
              <Explanation text={body.explanation} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function PublishedExams({ actorPromise }: ActorP) {
  const actor = await actorPromise;
  const { items } = await listManagedExams(actor, { page: 1, limit: 50, status: "PUBLISHED" });
  if (!items.length) return <EmptyState title="Chưa có đề đã xuất bản" />;
  const needRelease = await examsAwaitingManualRelease(actor, items.map((i) => i.id));
  return (
    <ul className="grid grid-cols-1 gap-3">
      {items.map((e) => (
        <li key={e.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <Link href={`/de-thi/${e.id}`} className="font-medium text-primary hover:underline">{e.title}</Link> <DemoBadge show={e.isDemo} />
            <span className="block text-sm text-muted-foreground">{e.subjectName} · {e.itemCount} câu · {e.ownerName}</span>
          </span>
          <PublishedExamActions id={e.id} canRelease={needRelease.has(e.id)} />
        </li>
      ))}
    </ul>
  );
}
