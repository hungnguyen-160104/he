import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/common/states";
import { ExamGrid } from "@/components/exams/exam-card";
import { getPublicSubjectBySlug, getPublicTopics, safePublic } from "@/lib/cache/public-data";
import { getPublicExamList } from "@/lib/cache/public-exams";
import { QUESTION_TYPE_LABELS } from "@/modules/questions/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/mon-hoc/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const s = await safePublic(() => getPublicSubjectBySlug(slug));
  return { title: s?.name ?? "Môn học" };
}

export default async function SubjectPage(props: PageProps<"/mon-hoc/[slug]">) {
  const { slug } = await props.params;
  const subject = await safePublic(() => getPublicSubjectBySlug(slug));
  if (!subject) notFound();
  const [topics, exams] = await Promise.all([safePublic(() => getPublicTopics(subject.id)), safePublic(() => getPublicExamList({ page: 1, limit: 12, subjectId: subject.id }))]);
  const roots = (topics ?? []).filter((t) => !t.parentId);
  const children = (id: string) => (topics ?? []).filter((t) => t.parentId === id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader
        title={subject.name}
        description={`Dạng câu hỏi: ${subject.allowedQuestionTypes.map((t) => QUESTION_TYPE_LABELS[t]).join(", ")}`}
        actions={
          <Button asChild>
            <Link href={`/luyen-tap?subjectId=${subject.id}`}>Luyện tập môn này</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Chủ đề</CardTitle></CardHeader>
          <CardContent>
            {roots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có chủ đề.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 text-sm">
                {roots.map((t) => (
                  <li key={t.id}>
                    <span className="font-medium">{t.name}</span>
                    {t.grade ? <span className="text-muted-foreground"> · Lớp {t.grade}</span> : null}
                    {children(t.id).length ? (
                      <ul className="ml-4 mt-1 grid grid-cols-1 gap-1 border-l pl-3 text-muted-foreground">
                        {children(t.id).map((c) => <li key={c.id}>{c.name}</li>)}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <section aria-labelledby="exams-heading">
          <h2 id="exams-heading" className="mb-3 text-lg">Đề thi</h2>
          {exams?.items.length ? <ExamGrid exams={exams.items} /> : <EmptyState title="Môn này chưa có đề thi" description="Bạn vẫn có thể luyện tập theo chủ đề nếu ngân hàng câu hỏi đã có câu được duyệt." />}
        </section>
      </div>
    </div>
  );
}
