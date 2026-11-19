import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EXAM_STATUS_LABELS, type ExamStatus } from "@/modules/exams/validation";
import { QUESTION_STATUS_LABELS, type QuestionStatus } from "@/modules/questions/types";
import { ATTEMPT_STATUS_LABELS, type AttemptStatus } from "@/modules/attempts/validation";

const TONE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-warning/20 text-warning-foreground",
  PENDING_REVIEW: "bg-warning/20 text-warning-foreground",
  PUBLISHED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  ARCHIVED: "bg-muted text-muted-foreground line-through",
  IN_PROGRESS: "bg-accent text-accent-foreground",
  SUBMITTED: "bg-success/15 text-success",
  EXPIRED: "bg-warning/20 text-warning-foreground",
  FINALIZED: "bg-success/15 text-success",
};

export function StatusBadge({ status, kind }: { status: string; kind: "question" | "exam" | "attempt" }) {
  const label =
    kind === "question"
      ? QUESTION_STATUS_LABELS[status as QuestionStatus]
      : kind === "exam"
        ? EXAM_STATUS_LABELS[status as ExamStatus]
        : ATTEMPT_STATUS_LABELS[status as AttemptStatus];
  return <Badge className={cn("border-transparent", TONE[status])}>{label ?? status}</Badge>;
}

export function DemoBadge({ show }: { show: boolean }) {
  return show ? <Badge variant="outline">DEMO</Badge> : null;
}
