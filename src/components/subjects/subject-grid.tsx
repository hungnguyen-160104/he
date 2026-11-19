import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_LABELS } from "@/modules/questions/types";
import type { SubjectDto } from "@/modules/subjects/service";

export function SubjectGrid({ subjects, examCounts }: { subjects: SubjectDto[]; examCounts?: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((s) => {
        const count = examCounts?.[s.id];
        return (
          <li key={s.id}>
            <Link
              href={`/mon-hoc/${s.slug}`}
              className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <span className="flex items-center gap-2 font-medium">
                <BookOpen className="size-5 text-primary" aria-hidden="true" />
                {s.name}
                {s.isDemo ? <Badge variant="outline">DEMO</Badge> : null}
              </span>
              <span className="text-xs text-muted-foreground">{s.allowedQuestionTypes.map((t) => QUESTION_TYPE_LABELS[t]).join(" · ")}</span>
              {count !== undefined ? (
                <span className="mt-auto text-sm text-muted-foreground">{count > 0 ? `${count} đề thi` : "Chưa có đề thi"}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
