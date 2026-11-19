"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Flag, Loader2, Plus, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FormMessage } from "@/components/forms/field";
import { apiFetch } from "@/lib/api/client";
import { PERIOD_LABELS, PERIOD_TYPES, type PeriodType } from "@/lib/utils/period";
import type { CampaignSummary } from "@/modules/rankings/service";
import type { PublicExamCard } from "@/modules/exams/service";
import type { SubjectDto } from "@/modules/subjects/service";

const STATUS_LABEL: Record<string, string> = { DRAFT: "Nháp", ACTIVE: "Đang hoạt động", CLOSED: "Đã chốt", ARCHIVED: "Lưu trữ" };
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function CampaignStatusBadge({ status, isLive }: { status: string; isLive?: boolean }) {
  return <Badge variant={status === "ACTIVE" ? "secondary" : "outline"}>{STATUS_LABEL[status] ?? status}{isLive ? " · đang diễn ra" : ""}</Badge>;
}

export function CampaignsManager({ subjects, campaigns }: { subjects: SubjectDto[]; campaigns: (CampaignSummary & { canFinalize: boolean })[] }) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [periodType, setPeriodType] = useState<PeriodType>("WEEK");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }));
  const [title, setTitle] = useState("");
  const [exams, setExams] = useState<PublicExamCard[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Noon Vietnam time on the chosen day avoids any boundary ambiguity.
  const referenceDate = `${date}T12:00:00+07:00`;

  useEffect(() => {
    if (!subjectId) return;
    const ctrl = new AbortController();
    apiFetch<PublicExamCard[]>(`/api/exams?subjectId=${subjectId}&limit=50`, { signal: ctrl.signal })
      .then((r) => {
        setExams(r.ok ? r.data : []);
        setSelected([]);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [subjectId]);

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const ctrl = new AbortController();
    apiFetch<{ label: string; periodStartAt: string; periodEndAt: string }>(`/api/admin/ranking-campaigns/preview?periodType=${periodType}&date=${encodeURIComponent(referenceDate)}`, { signal: ctrl.signal })
      .then((r) => setPreview(r.ok ? r.data.label : null))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [periodType, date, referenceDate]);

  const create = async () => {
    setBusy(true);
    setError(null);
    const r = await apiFetch<{ id: string }>("/api/admin/ranking-campaigns", { body: { title: title || `${subjects.find((s) => s.id === subjectId)?.name ?? ""} — ${preview ?? ""}`, subjectId, periodType, referenceDate, examIds: selected } });
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    toast.success("Đã tạo kỳ xếp hạng (nháp).");
    router.push(`/quan-tri/xep-hang/${r.data.id}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_26rem]">
      <section aria-label="Danh sách kỳ" className="grid grid-cols-1 h-fit gap-2">
        {campaigns.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có kỳ xếp hạng.</p> : campaigns.map((c) => (
          <Link key={c.id} href={`/quan-tri/xep-hang/${c.id}`} className="flex flex-col gap-1 rounded-lg border bg-card p-4 hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
            <span><span className="font-medium">{c.title}</span><span className="block text-sm text-muted-foreground">{c.subjectName} · {c.periodLabel} · {c.examCount} đề</span></span>
            <span className="flex gap-2"><CampaignStatusBadge status={c.status} isLive={c.isLive} />{c.canFinalize ? <Badge variant="destructive">Cần chốt</Badge> : null}</span>
          </Link>
        ))}
      </section>
      <Card className="h-fit">
        <CardHeader><CardTitle className="text-base">Tạo kỳ xếp hạng</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3">
          {error ? <FormMessage kind="error">{error}</FormMessage> : null}
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="c-subject">Môn</Label>
            <select id="c-subject" className={selectClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="c-period">Loại kỳ</Label>
              <select id="c-period" className={selectClass} value={periodType} onChange={(e) => setPeriodType(e.target.value as PeriodType)}>{PERIOD_TYPES.map((p) => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}</select>
            </div>
            <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="c-date">Ngày bất kỳ trong kỳ</Label><Input id="c-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <p className="text-sm text-muted-foreground">Kỳ (giờ Việt Nam, tuần bắt đầu thứ Hai): <strong className="text-foreground">{preview ?? "…"}</strong></p>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="c-title">Tên kỳ (không bắt buộc)</Label><Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tự đặt theo môn và kỳ" /></div>
          <fieldset className="grid grid-cols-1 gap-2">
            <legend className="text-sm font-medium">Bộ đề (đã xuất bản)</legend>
            <p className="text-xs text-muted-foreground">Khuyến nghị dùng đề riêng cho mỗi kỳ (nhân bản đề nếu cần) để không ai đã làm trước.</p>
            {exams.length === 0 ? <p className="text-sm text-muted-foreground">Môn này chưa có đề đã xuất bản.</p> : exams.map((e) => (
              <label key={e.id} className="flex items-start gap-2 text-sm">
                <Checkbox checked={selected.includes(e.id)} onCheckedChange={(v) => setSelected(v === true ? [...selected, e.id] : selected.filter((x) => x !== e.id))} className="mt-0.5" />
                <span>{e.title} <span className="text-muted-foreground">({e.questionCount} câu, {e.attemptCount} lượt)</span></span>
              </label>
            ))}
          </fieldset>
          <Button onClick={() => void create()} disabled={busy || !selected.length}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Tạo kỳ (nháp)</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function CampaignActions({ id, status, canFinalize, canActivate }: { id: string; status: string; canFinalize: boolean; canActivate: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const activate = async () => {
    setBusy(true);
    const r = await apiFetch(`/api/admin/ranking-campaigns/${id}/activate`, { method: "POST", body: {} });
    setBusy(false);
    if (!r.ok) {
      const problems = (r.error.details as { problems?: string[] } | undefined)?.problems;
      return void toast.error(problems?.length ? `${r.error.message} ${problems.join(" ")}` : r.error.message);
    }
    toast.success("Đã kích hoạt kỳ xếp hạng.");
    router.refresh();
  };

  // Finalize in small batches until the server reports done (serverless-friendly).
  const finalize = async () => {
    setBusy(true);
    for (let i = 0; i < 50; i++) {
      const r = await apiFetch<{ done: boolean; remaining: number; ranked?: number }>(`/api/admin/ranking-campaigns/${id}/finalize`, { method: "POST", body: {} });
      if (!r.ok) {
        setBusy(false);
        setProgress(null);
        return void toast.error(r.error.message);
      }
      if (r.data.done) {
        setBusy(false);
        setProgress(null);
        toast.success(`Đã chốt kỳ: ${r.data.ranked ?? 0} học sinh được xếp hạng.`);
        return router.refresh();
      }
      setProgress(`Đang chốt các bài hết giờ… còn ${r.data.remaining}`);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "DRAFT" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild><Button disabled={busy || !canActivate}><Rocket className="size-4" />Kích hoạt</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Kích hoạt kỳ xếp hạng?</AlertDialogTitle><AlertDialogDescription>Sau khi kích hoạt, bộ đề và thời gian kỳ không thể thay đổi. Đáp án các đề trong kỳ sẽ được ẩn tới khi kỳ kết thúc.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => void activate()}>Kích hoạt</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      {status === "ACTIVE" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild><Button disabled={busy || !canFinalize} variant={canFinalize ? "default" : "outline"}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}Chốt kỳ</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Chốt kỳ xếp hạng?</AlertDialogTitle><AlertDialogDescription>Hệ thống sẽ nộp tự động các bài đã hết giờ, tính bảng xếp hạng cuối cùng và lưu bản chụp bất biến. Không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => void finalize()}>Chốt kỳ</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      {status === "ACTIVE" && !canFinalize ? <span className="text-sm text-muted-foreground">Có thể chốt sau khi kỳ kết thúc.</span> : null}
      {status === "CLOSED" ? <span className="inline-flex items-center gap-1 text-sm text-success"><CheckCircle2 className="size-4" />Đã chốt — bảng xếp hạng cố định</span> : null}
      {progress ? <span role="status" className="text-sm text-muted-foreground">{progress}</span> : null}
    </div>
  );
}
