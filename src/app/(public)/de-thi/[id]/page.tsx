import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, FileText, ShieldCheck, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartExamButton } from "@/components/exams/start-exam-button";
import { RichText } from "@/components/content/rich-text";
import { getHeaderUser } from "@/lib/auth/session";
import { getPublicExamDetail } from "@/lib/cache/public-exams";
import { safePublic } from "@/lib/cache/public-data";
import { isUnlimitedMode } from "@/lib/env";
import { formatDateVN, formatMinutes } from "@/lib/utils/format";
import { periodLabel } from "@/lib/utils/period";
import { EXAM_MODE_LABELS, RELEASE_POLICY_LABELS } from "@/modules/exams/validation";
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/modules/questions/types";
import { listCampaignsForExam } from "@/modules/rankings/public";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/de-thi/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const exam = await safePublic(() => getPublicExamDetail(id));
  return { title: exam?.title ?? "Đề thi" };
}

export default async function ExamDetailPage(props: PageProps<"/de-thi/[id]">) {
  const { id } = await props.params;
  const [exam, user] = await Promise.all([safePublic(() => getPublicExamDetail(id)), getHeaderUser()]);
  if (!exam) notFound();
  const campaigns = (await safePublic(() => listCampaignsForExam(exam.id))) ?? [];
  const unlimited = isUnlimitedMode();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <nav aria-label="Đường dẫn" className="mb-3 text-sm text-muted-foreground">
        <Link href="/de-thi" className="hover:underline">Đề thi</Link> / <Link href={`/mon-hoc/${exam.subjectSlug}`} className="hover:underline">{exam.subjectName}</Link>
      </nav>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{exam.subjectName}</Badge>
            <Badge variant="outline">{EXAM_MODE_LABELS[exam.mode]}</Badge>
            {exam.difficulty ? <Badge variant="outline">{DIFFICULTY_LABELS[exam.difficulty]}</Badge> : null}
            <Badge variant="outline">Năm {exam.examYear}</Badge>
            {exam.isDemo ? <Badge variant="outline">DEMO — không phải đề chính thức</Badge> : null}
          </div>
          <h1 className="text-2xl sm:text-3xl">{exam.title}</h1>
          {exam.publishedAt ? <p className="mt-1 text-sm text-muted-foreground">Xuất bản {formatDateVN(exam.publishedAt)}</p> : null}
        </div>
        <StartExamButton examId={exam.id} signedIn={Boolean(user)} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card><CardContent className="flex flex-col items-start gap-1 px-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"><FileText className="size-5 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-muted-foreground sm:text-sm">Số câu</p><p className="font-semibold">{exam.questionCount}</p></div></CardContent></Card>
        <Card><CardContent className="flex flex-col items-start gap-1 px-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"><Clock3 className="size-5 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-muted-foreground sm:text-sm">Thời gian</p><p className="font-semibold">{unlimited ? "Không giới hạn" : formatMinutes(exam.durationMinutes)}</p></div></CardContent></Card>
        <Card><CardContent className="flex flex-col items-start gap-1 px-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"><Users className="size-5 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-muted-foreground sm:text-sm">Lượt làm</p><p className="font-semibold">{exam.attemptCount}</p></div></CardContent></Card>
      </div>

      {exam.description ? (
        <Card className="mt-4"><CardContent><RichText text={exam.description} /></CardContent></Card>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Cấu trúc & cách tính điểm</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 text-sm">
            {exam.sections.map((s) => (
              <div key={s.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                <span>{s.title || QUESTION_TYPE_LABELS[s.questionType]}</span>
                <span className="whitespace-nowrap text-muted-foreground">{s.count} câu × tối đa {s.pointsEach.replace(".", ",")} điểm</span>
              </div>
            ))}
            <p className="text-muted-foreground">Điểm được quy đổi về thang 10 theo “{exam.ruleName}”.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Quy định</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm">
            <p className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />{RELEASE_POLICY_LABELS[exam.resultReleasePolicy]}.</p>
            <p className="flex gap-2"><Clock3 className="size-4 shrink-0 text-primary" aria-hidden="true" />{unlimited
                ? `Chế độ thử nghiệm: không giới hạn thời gian (đề chuẩn ${formatMinutes(exam.durationMinutes)}).`
                : exam.mode === "MOCK"
                  ? "Thời gian tính theo đồng hồ máy chủ; hết giờ bài được nộp tự động với các câu đã lưu."
                  : "Không giới hạn thời gian."}</p>
            <p className="flex gap-2"><Trophy className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {campaigns.length
                ? `Thuộc kỳ xếp hạng: ${campaigns.map((c) => `${c.title} (${periodLabel(c.periodType, new Date(c.periodStartAt), new Date(c.periodEndAt))})`).join("; ")}. Chỉ lượt làm đầu tiên trong kỳ được tính.`
                : "Đề không thuộc kỳ xếp hạng nào. Bạn có thể làm lại không giới hạn."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
