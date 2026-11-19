"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock3, CloudOff, Grid3x3, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RichText } from "@/components/content/rich-text";
import { QuestionMedia } from "@/components/questions/question-content";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/format";
import type { AttemptTakingDto } from "@/modules/attempts/service";
import type { StatementId } from "@/modules/questions/types";

type Response = { optionId: string | null } | { values: Partial<Record<StatementId, boolean | null>> } | { text: string } | null;
type SaveState = "saved" | "dirty" | "saving" | "error";

const DEBOUNCE_MS = 1500;
const MAX_RETRIES = 3;

function isAnswered(r: Response | undefined): boolean {
  if (!r) return false;
  if ("optionId" in r) return Boolean(r.optionId);
  if ("values" in r) return Object.values(r.values).some((v) => v === true || v === false);
  return r.text.trim().length > 0;
}

export function ExamTaker({ initial }: { initial: AttemptTakingDto }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Response>>(initial.answers as Record<string, Response>);
  const [marked, setMarked] = useState<Set<string>>(new Set(initial.marked));
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [conflict, setConflict] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const revision = useRef(initial.revision);
  const dirty = useRef<Set<string>>(new Set());
  const markedDirty = useRef(false);
  const answersRef = useRef(answers);
  const markedRef = useRef(marked);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const retries = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Server clock is the source of truth: correct for local clock drift.
  const [clockOffset] = useState(() => new Date(initial.serverTime).getTime() - Date.now());
  const warned = useRef<{ five: boolean; one: boolean }>({ five: false, one: false });
  const flushRef = useRef<(opts?: { keepalive?: boolean }) => Promise<boolean>>(async () => true);
  const submitRef = useRef<() => Promise<void>>(async () => undefined);
  const autoSubmitted = useRef(false);

  const items = initial.items;
  const item = items[index]!;
  const expiresAt = initial.expiresAt ? new Date(initial.expiresAt).getTime() : null;
  const remaining = expiresAt ? expiresAt - (now + clockOffset) : null;
  const sectionTitle = useMemo(() => new Map(initial.sections.map((s) => [s.id, s.title])), [initial.sections]);
  const answeredCount = items.filter((i) => isAnswered(answers[i.itemId])).length;

  const goToResult = useCallback(() => {
    finished.current = true;
    router.replace(`/ket-qua/${initial.id}`);
    router.refresh();
  }, [router, initial.id]);

  /** Push pending changes. Returns true when everything is saved. */
  const flush = useCallback(async (opts: { keepalive?: boolean } = {}): Promise<boolean> => {
    if (finished.current) return true;
    if (inFlight.current) {
      await inFlight.current;
      if (!dirty.current.size && !markedDirty.current) return true;
    }
    if (!dirty.current.size && !markedDirty.current) return true;
    const ids = [...dirty.current];
    const payload = {
      revision: revision.current,
      answers: Object.fromEntries(ids.map((id) => [id, answersRef.current[id] ?? null])),
      ...(markedDirty.current ? { marked: [...markedRef.current] } : {}),
    };
    dirty.current = new Set();
    markedDirty.current = false;
    setSaveState("saving");
    const run = (async () => {
      if (opts.keepalive) {
        // Best effort while the tab is being hidden/closed.
        try {
          const res = await fetch(`/api/attempts/${initial.id}/answers`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true, credentials: "same-origin" });
          const body = (await res.json().catch(() => null)) as { success?: boolean; data?: { revision: number } } | null;
          if (res.ok && body?.data) {
            revision.current = body.data.revision;
            setSaveState("saved");
            return true;
          }
        } catch {
          /* fall through to retry */
        }
        ids.forEach((id) => dirty.current.add(id));
        setSaveState("error");
        return false;
      }
      const res = await apiFetch<{ revision: number }>(`/api/attempts/${initial.id}/answers`, { method: "PATCH", body: payload });
      if (res.ok) {
        revision.current = res.data.revision;
        retries.current = 0;
        setSaveState(dirty.current.size || markedDirty.current ? "dirty" : "saved");
        return true;
      }
      if (res.error.code === "REVISION_CONFLICT") {
        setConflict(true);
        setSaveState("error");
        return false;
      }
      if (res.error.code === "ATTEMPT_EXPIRED" || res.error.code === "ATTEMPT_CLOSED") {
        toast.info(res.error.message);
        goToResult();
        return false;
      }
      // Network/server error: keep changes and retry with backoff (bounded).
      ids.forEach((id) => dirty.current.add(id));
      if (payload.marked) markedDirty.current = true;
      setSaveState("error");
      if (retries.current < MAX_RETRIES) {
        retries.current++;
        timer.current = setTimeout(() => void flushRef.current(), 2000 * retries.current);
      }
      return false;
    })();
    inFlight.current = run;
    const ok = await run;
    inFlight.current = null;
    return ok;
  }, [initial.id, goToResult]);

  const schedule = useCallback(() => {
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
  }, [flush]);

  const setAnswer = (itemId: string, r: Response) => {
    const next = { ...answersRef.current, [itemId]: r };
    answersRef.current = next;
    setAnswers(next);
    dirty.current.add(itemId);
    retries.current = 0;
    schedule();
  };

  const toggleMark = (itemId: string) => {
    const next = new Set(markedRef.current);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    markedRef.current = next;
    setMarked(next);
    markedDirty.current = true;
    schedule();
  };

  const go = (i: number) => {
    if (i < 0 || i >= items.length) return;
    void flush();
    setIndex(i);
    setNavOpen(false);
    // Bring the new question's heading to the top (below the sticky bars) and move focus there.
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView({ block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  };

  const submit = useCallback(async () => {
    if (submitting || finished.current) return;
    setSubmitting(true);
    await flush();
    const res = await apiFetch<{ status: string }>(`/api/attempts/${initial.id}/submit`, { method: "POST", body: {} });
    if (!res.ok) {
      setSubmitting(false);
      toast.error(res.error.message);
      return;
    }
    goToResult();
  }, [submitting, flush, initial.id, goToResult]);

  useEffect(() => {
    flushRef.current = flush;
    submitRef.current = submit;
  }, [flush, submit]);

  // Countdown (display only — the server enforces expiry). Warnings + auto-submit run in the tick.
  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const rem = expiresAt - (n + clockOffset);
      if (finished.current) return;
      if (rem <= 5 * 60_000 && !warned.current.five) {
        warned.current.five = true;
        toast.warning("Còn 5 phút làm bài.");
      }
      if (rem <= 60_000 && !warned.current.one) {
        warned.current.one = true;
        toast.warning("Còn 1 phút! Bài sẽ tự nộp khi hết giờ.");
      }
      if (rem <= 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        toast.info("Hết giờ — đang nộp bài với các câu đã lưu.");
        void submitRef.current();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, clockOffset]);

  // Save when the tab is hidden; retry when the network comes back; warn before leaving with unsaved changes.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush({ keepalive: true });
    };
    const onOnline = () => {
      retries.current = 0;
      void flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!finished.current && (dirty.current.size || markedDirty.current || inFlight.current)) e.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  const reloadFromServer = async () => {
    const res = await apiFetch<AttemptTakingDto>(`/api/attempts/${initial.id}`);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    if (res.data.status !== "IN_PROGRESS") return goToResult();
    dirty.current = new Set();
    markedDirty.current = false;
    revision.current = res.data.revision;
    answersRef.current = res.data.answers as Record<string, Response>;
    markedRef.current = new Set(res.data.marked);
    setAnswers(answersRef.current);
    setMarked(markedRef.current);
    setSaveState("saved");
    setConflict(false);
  };

  const unanswered = items.length - answeredCount;
  const lowTime = remaining !== null && remaining <= 5 * 60_000;

  const navigator = (
    <div className="grid grid-cols-1 gap-3">
      <p className="text-sm text-muted-foreground">
        Đã làm <strong className="text-foreground">{answeredCount}</strong>/{items.length} câu
      </p>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5" role="list" aria-label="Danh sách câu hỏi">
        {items.map((it, i) => {
          const done = isAnswered(answers[it.itemId]);
          const isMarked = marked.has(it.itemId);
          return (
            <button
              key={it.itemId}
              type="button"
              role="listitem"
              onClick={() => go(i)}
              aria-current={i === index ? "step" : undefined}
              aria-label={`Câu ${i + 1}${done ? ", đã trả lời" : ", chưa trả lời"}${isMarked ? ", đã đánh dấu" : ""}`}
              className={cn(
                "relative flex h-10 items-center justify-center rounded-md border text-sm font-medium tabular-nums lg:h-9",
                done ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
                i === index && "ring-2 ring-ring ring-offset-1",
              )}
            >
              {i + 1}
              {isMarked ? <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-warning" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      <p className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="size-3 rounded-sm bg-primary" aria-hidden="true" />Đã làm</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full bg-warning" aria-hidden="true" />Xem lại</span>
      </p>
    </div>
  );

  const saveIndicator = (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-1 text-xs", saveState === "error" ? "text-destructive" : "text-muted-foreground")}>
      {saveState === "saving" ? <><Loader2 className="size-3 animate-spin" aria-hidden="true" />Đang lưu…</> : null}
      {saveState === "saved" ? <><CheckCircle2 className="size-3 text-success" aria-hidden="true" />Đã lưu</> : null}
      {saveState === "dirty" ? <>Chưa lưu<span className="hidden sm:inline">&nbsp;thay đổi</span></> : null}
      {saveState === "error" ? (
        <>
          <CloudOff className="size-3" aria-hidden="true" /><span className="hidden sm:inline">Lỗi mạng,</span> chưa lưu
          <button type="button" className="ml-1 inline-flex min-h-8 items-center underline" onClick={() => { retries.current = 0; void flush(); }}>Lưu ngay</button>
        </>
      ) : null}
    </span>
  );

  const timerEl = remaining !== null ? (
    <span className={cn("inline-flex items-center gap-1 font-mono text-lg font-semibold tabular-nums", lowTime && "text-destructive")} aria-label={`Thời gian còn lại ${formatDuration(remaining)}`}>
      <Clock3 className="size-4" aria-hidden="true" />
      {formatDuration(remaining)}
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Không giới hạn<span className="hidden sm:inline"> thời gian</span></span>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-0 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      {/* Mobile sticky bar */}
      <div className="sticky top-14 z-30 -mx-4 -mt-3 mb-3 flex min-h-12 items-center justify-between gap-2 border-b bg-card/95 px-4 py-1.5 backdrop-blur lg:hidden">
        {timerEl}
        <div className="flex min-w-0 items-center gap-2">
          {saveIndicator}
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Mở danh sách câu"><Grid3x3 className="size-4" />{index + 1}/{items.length}</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-xl">
              <SheetHeader><SheetTitle>Danh sách câu hỏi</SheetTitle></SheetHeader>
              <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">{navigator}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <section aria-labelledby="question-heading" className="min-w-0">
          <p className="mb-1 line-clamp-2 text-sm text-muted-foreground">{initial.title}</p>
          {item.sectionId && sectionTitle.get(item.sectionId) ? <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">{sectionTitle.get(item.sectionId)}</p> : null}
          <div className="rounded-lg border bg-card p-3 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-2 sm:items-start sm:gap-3">
              <h2 id="question-heading" ref={headingRef} tabIndex={-1} className="scroll-mt-32 text-lg outline-none lg:scroll-mt-20">
                Câu {index + 1} <span className="text-sm font-normal text-muted-foreground">({item.maxPoints} điểm)</span>
              </h2>
              <Button variant={marked.has(item.itemId) ? "secondary" : "ghost"} size="sm" className="shrink-0" onClick={() => toggleMark(item.itemId)} aria-pressed={marked.has(item.itemId)}>
                {marked.has(item.itemId) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {marked.has(item.itemId) ? "Đã đánh dấu" : <>Đánh dấu<span className="hidden sm:inline">&nbsp;xem lại</span></>}
              </Button>
            </div>
            <RichText text={item.view.stem} className="text-base leading-relaxed" />
            <QuestionMedia media={item.view.media} />
            <div className="mt-4">
              <AnswerInput item={item} value={answers[item.itemId] ?? null} onChange={(r) => setAnswer(item.itemId, r)} />
            </div>
          </div>
          <div className="mt-4 hidden items-center justify-between gap-2 lg:flex">
            <Button variant="outline" onClick={() => go(index - 1)} disabled={index === 0}><ChevronLeft className="size-4" />Câu trước</Button>
            {saveIndicator}
            <Button variant="outline" onClick={() => go(index + 1)} disabled={index === items.length - 1}>Câu sau<ChevronRight className="size-4" /></Button>
          </div>
        </section>

        <aside className="hidden lg:block" aria-label="Bảng điều khiển bài làm">
          <div className="sticky top-20 grid grid-cols-1 gap-4 rounded-lg border bg-card p-4">
            {timerEl}
            {navigator}
            <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Nộp bài
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile bottom bar: previous / submit / next within thumb reach */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-[auto_1fr_auto] items-center gap-2">
          <Button variant="outline" size="icon-lg" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Câu trước"><ChevronLeft className="size-5" /></Button>
          <Button size="lg" onClick={() => setConfirmOpen(true)} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Nộp bài ({answeredCount}/{items.length})
          </Button>
          <Button variant="outline" size="icon-lg" onClick={() => go(index + 1)} disabled={index === items.length - 1} aria-label="Câu sau"><ChevronRight className="size-5" /></Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !submitting && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nộp bài?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đã trả lời {answeredCount}/{items.length} câu.
              {unanswered ? ` Còn ${unanswered} câu chưa trả lời.` : ""}
              {marked.size ? ` Có ${marked.size} câu đang đánh dấu xem lại.` : ""} Sau khi nộp bạn không thể sửa câu trả lời.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Tiếp tục làm</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={(e) => { e.preventDefault(); void submit(); }}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}Nộp bài
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={conflict}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-warning" />Bài làm đã thay đổi ở nơi khác</AlertDialogTitle>
            <AlertDialogDescription>
              Có vẻ bạn đang mở bài này ở một tab hoặc thiết bị khác. Để tránh ghi đè, hãy tải lại bản mới nhất từ máy chủ (thay đổi chưa lưu ở tab này sẽ bị bỏ).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => void reloadFromServer()}>Tải lại bản mới nhất</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AnswerInput({ item, value, onChange }: { item: AttemptTakingDto["items"][number]; value: Response; onChange: (r: Response) => void }) {
  const view = item.view;
  if (view.type === "SINGLE_CHOICE") {
    const selected = value && "optionId" in value ? value.optionId : null;
    return (
      <fieldset>
        <legend className="sr-only">Chọn một đáp án</legend>
        <div className="grid grid-cols-1 gap-2">
          {view.options.map((o) => (
            <label
              key={o.id}
              className={cn(
                "flex min-h-12 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                selected === o.id && "border-primary bg-accent",
              )}
            >
              <input type="radio" name={`q-${item.itemId}`} value={o.id} checked={selected === o.id} onChange={() => onChange({ optionId: o.id })} className="mt-1 size-4 accent-[var(--primary)]" />
              <span className="font-semibold">{o.id}.</span>
              <RichText as="span" text={o.text} />
            </label>
          ))}
        </div>
        {selected ? <button type="button" className="mt-1 min-h-10 text-sm text-muted-foreground underline" onClick={() => onChange({ optionId: null })}>Bỏ chọn</button> : null}
      </fieldset>
    );
  }
  if (view.type === "TRUE_FALSE") {
    const values = value && "values" in value ? value.values : {};
    const set = (id: StatementId, v: boolean | null) => onChange({ values: { ...values, [id]: v } });
    return (
      <div className="grid grid-cols-1 gap-2">
        {view.statements.map((s) => (
          <fieldset key={s.id} className="rounded-md border p-3">
            <legend className="sr-only">Ý {s.id}</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex gap-2"><span className="font-semibold">{s.id})</span><RichText as="span" text={s.text} /></p>
              <div className="flex shrink-0 items-center gap-2">
                {([true, false] as const).map((v) => (
                  <label key={String(v)} className={cn("flex min-h-11 min-w-16 flex-1 cursor-pointer sm:min-h-10 sm:flex-none items-center justify-center gap-1.5 rounded-md border px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", values[s.id] === v && (v ? "border-success bg-success/10" : "border-destructive bg-destructive/10"))}>
                    <input type="radio" name={`q-${item.itemId}-${s.id}`} checked={values[s.id] === v} onChange={() => set(s.id, v)} className="size-4" />
                    {v ? "Đúng" : "Sai"}
                  </label>
                ))}
                {values[s.id] === true || values[s.id] === false ? (
                  <button type="button" className="min-h-10 px-1 text-xs text-muted-foreground underline" onClick={() => set(s.id, null)} aria-label={`Bỏ chọn ý ${s.id}`}>Bỏ</button>
                ) : null}
              </div>
            </div>
          </fieldset>
        ))}
      </div>
    );
  }
  const text = value && "text" in value ? value.text : "";
  return (
    <div className="grid max-w-sm grid-cols-1 gap-1.5">
      <label htmlFor={`sa-${item.itemId}`} className="text-sm font-medium">Câu trả lời của bạn</label>
      <Input id={`sa-${item.itemId}`} className="h-11 text-base" value={text} maxLength={100} inputMode="text" autoComplete="off" onChange={(e) => onChange({ text: e.target.value })} aria-describedby={`sa-hint-${item.itemId}`} />
      <p id={`sa-hint-${item.itemId}`} className="text-xs text-muted-foreground">Số thập phân có thể dùng dấu phẩy hoặc dấu chấm (ví dụ 1,5 hoặc 1.5). Không nhập dấu phân cách hàng nghìn.</p>
    </div>
  );
}
