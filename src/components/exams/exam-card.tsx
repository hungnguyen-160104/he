import Link from "next/link";
import { Clock3, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS } from "@/modules/questions/types";
import { EXAM_MODE_LABELS } from "@/modules/exams/validation";
import { formatMinutes } from "@/lib/utils/format";
import type { PublicExamCard } from "@/modules/exams/service";

export function ExamCard({ exam }: { exam: PublicExamCard }) {
  return (
    <Link href={`/de-thi/${exam.id}`} className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{exam.subjectName}</Badge>
        <Badge variant="outline">{EXAM_MODE_LABELS[exam.mode]}</Badge>
        {exam.difficulty ? <Badge variant="outline">{DIFFICULTY_LABELS[exam.difficulty]}</Badge> : null}
        {exam.isDemo ? <Badge variant="outline">DEMO</Badge> : null}
      </div>
      <h3 className="font-medium leading-snug">{exam.title}</h3>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1"><FileText className="size-4" aria-hidden="true" />{exam.questionCount} câu</span>
        <span className="inline-flex items-center gap-1"><Clock3 className="size-4" aria-hidden="true" />{formatMinutes(exam.durationMinutes)}</span>
        <span className="inline-flex items-center gap-1"><Users className="size-4" aria-hidden="true" />{exam.attemptCount} lượt</span>
      </div>
    </Link>
  );
}

export function ExamGrid({ exams }: { exams: PublicExamCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((e) => (
        <li key={e.id}>
          <ExamCard exam={e} />
        </li>
      ))}
    </ul>
  );
}
