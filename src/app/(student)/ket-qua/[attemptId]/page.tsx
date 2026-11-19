import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock3, Lock, MinusCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichText } from "@/components/content/rich-text";
import { QuestionMedia } from "@/components/questions/question-content";
import { AnswerKey, Explanation } from "@/components/questions/answer-key";
import { StatusBadge } from "@/components/common/status-badges";
import { requirePageActor } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { formatDateTimeVN, formatDuration, formatScoreScaled } from "@/lib/utils/format";
import { getAttemptResult, type ResultItemDto } from "@/modules/attempts/service";
import { QUESTION_TYPE_LABELS } from "@/modules/questions/types";

export const metadata: Metadata = { title: "Kết quả" };
export const dynamic = "force-dynamic";

export default async function ResultPage(props: PageProps<"/ket-qua/[attemptId]">) {
  const actor = await requirePageActor();
  const { attemptId } = await props.params;
  let r;
  try {
    r = await getAttemptResult(actor, attemptId);
  } catch (err) {
    if (isAppError(err) && err.status === 404) notFound();
    if (isAppError(err) && err.status === 409) redirect(`/lam-bai/${attemptId}`);
    throw err;
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{r.kind === "PRACTICE" ? "Luyện tập" : r.mode === "MOCK" ? "Thi thử" : "Đề luyện tập"}</p>
          <h1 className="text-2xl">{r.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge kind="attempt" status={r.status} />
            {r.kind === "EXAM" ? (r.isFirstRankedAttempt ? <Badge variant="outline">Lượt đầu tiên</Badge> : <Badge variant="outline">Lượt làm lại — không tính xếp hạng</Badge>) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {r.examId ? <Button asChild variant="outline"><Link href={`/de-thi/${r.examId}`}>Làm lại</Link></Button> : <Button asChild variant="outline"><Link href="/luyen-tap">Luyện tập tiếp</Link></Button>}
          <Button asChild><Link href="/lich-su">Lịch sử</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Điểm (thang 10)</p>
            <p className="text-5xl font-bold tabular-nums text-primary">{formatScoreScaled(r.scoreScaled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid grid-cols-1 gap-1 text-sm">
            <p>Đã trả lời: <strong>{r.answeredCount}/{r.totalItems}</strong> câu</p>
            <p className="flex items-center gap-1"><Clock3 className="size-4" aria-hidden="true" />Thời gian làm: <strong>{r.durationMs !== null ? formatDuration(r.durationMs) : "—"}</strong></p>
            <p className="text-muted-foreground">Bắt đầu {formatDateTimeVN(r.startedAt)}</p>
            <p className="text-muted-foreground">{r.status === "EXPIRED" ? "Tự nộp khi hết giờ" : "Nộp"} {formatDateTimeVN(r.finalizedAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid grid-cols-1 gap-1 text-sm">
            {r.typeStats.map((s) => (
              <p key={s.type}>
                {QUESTION_TYPE_LABELS[s.type]}: {s.answered}/{s.total} đã làm{s.correct !== null ? `, ${s.correct} đúng hoàn toàn` : ""}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      {!r.released ? (
        <div role="status" className="mt-6 flex gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          <Lock className="size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Đáp án và lời giải chưa được công bố</p>
            <p>{r.withheldReason}</p>
            {r.releaseAt ? <p className="mt-1">Dự kiến công bố sau: <strong>{formatDateTimeVN(r.releaseAt)}</strong></p> : null}
          </div>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4" aria-labelledby="detail-heading">
          <h2 id="detail-heading" className="text-xl">Chi tiết từng câu</h2>
          {r.items!.map((it, i) => <ResultItem key={it.itemId} item={it} index={i} sectionTitle={r.sections.find((s) => s.id === it.sectionId)?.title} />)}
        </section>
      )}
    </>
  );
}

function ResultItem({ item, index, sectionTitle }: { item: ResultItemDto; index: number; sectionTitle?: string }) {
  const icon = !item.answered ? <MinusCircle className="size-5 text-muted-foreground" /> : item.correct ? <CheckCircle2 className="size-5 text-success" /> : <XCircle className="size-5 text-destructive" />;
  const response = (item.response ?? {}) as { optionId?: string | null; values?: Record<string, boolean | null>; text?: string };
  const key = (item.key ?? {}) as { correctOptionId?: string };
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}Câu {index + 1}
          {sectionTitle ? <span className="text-xs font-normal text-muted-foreground">· {sectionTitle}</span> : null}
        </CardTitle>
        <span className="text-sm tabular-nums text-muted-foreground">{item.awarded}/{item.max} điểm</span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3">
        <RichText text={item.view.stem} />
        <QuestionMedia media={item.view.media} />
        {item.view.type === "SINGLE_CHOICE" ? (
          <ul className="grid grid-cols-1 gap-1.5">
            {item.view.options.map((o) => (
              <li key={o.id} className={cn("flex gap-2 rounded-md border px-3 py-2 text-sm", key.correctOptionId === o.id && "border-success bg-success/10", response.optionId === o.id && key.correctOptionId !== o.id && "border-destructive bg-destructive/10")}>
                <span className="font-semibold">{o.id}.</span><RichText as="span" text={o.text} />
                {response.optionId === o.id ? <Badge variant="outline" className="ml-auto">Bạn chọn</Badge> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {item.view.type === "TRUE_FALSE" ? (
          <ul className="grid grid-cols-1 gap-1.5">
            {item.view.statements.map((s) => {
              const res = item.statementResults?.[s.id];
              const mine = response.values?.[s.id];
              return (
                <li key={s.id} className={cn("flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm", res === true && "border-success bg-success/10", res === false && "border-destructive bg-destructive/10")}>
                  <span className="font-semibold">{s.id})</span><RichText as="span" text={s.text} />
                  <span className="ml-auto text-xs text-muted-foreground">Bạn chọn: {mine === true ? "Đúng" : mine === false ? "Sai" : "bỏ trống"}</span>
                </li>
              );
            })}
            <li className="text-xs text-muted-foreground">Số ý đúng: {item.correctCount ?? 0}/4</li>
          </ul>
        ) : null}
        {item.view.type === "SHORT_ANSWER" ? <p className="text-sm">Câu trả lời của bạn: <strong>{response.text?.trim() ? response.text : "(bỏ trống)"}</strong></p> : null}
        <AnswerKey type={item.view.type} answer={item.key} />
        <Explanation text={item.explanation} />
      </CardContent>
    </Card>
  );
}
