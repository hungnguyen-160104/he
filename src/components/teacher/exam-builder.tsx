"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import { ArrowDown, ArrowUp, Copy, Eye, Loader2, Plus, Save, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormMessage } from "@/components/forms/field";
import { StatusBadge } from "@/components/common/status-badges";
import { RichText } from "@/components/content/rich-text";
import { QuestionContent } from "@/components/questions/question-content";
import { apiFetch } from "@/lib/api/client";
import { examDraftSchema, EXAM_MODE_LABELS, RELEASE_POLICIES, RELEASE_POLICY_LABELS, type ExamMode, type ReleasePolicy } from "@/modules/exams/validation";
import { DIFFICULTIES, DIFFICULTY_LABELS, QUESTION_TYPE_LABELS, type Difficulty, type QuestionType } from "@/modules/questions/types";
import type { StudentQuestionView } from "@/modules/questions/dto";
import type { ExamEditorDto } from "@/modules/exams/service";
import type { ScoringRuleDto } from "@/modules/exams/scoring-service";
import type { SubjectDto } from "@/modules/subjects/service";

type Picked = { questionVersionId: string; type: QuestionType; view: StudentQuestionView | null };
type PickerRow = { questionId: string; questionVersionId: string; versionNumber: number; type: QuestionType; difficulty: Difficulty; isDemo: boolean; view: StudentQuestionView | null };

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ExamBuilder({ subjects, initial }: { subjects: SubjectDto[]; initial: ExamEditorDto | null }) {
  const router = useRouter();
  const init = initial?.input;
  const [title, setTitle] = useState(init?.title ?? "");
  const [description, setDescription] = useState(init?.description ?? "");
  const [subjectId, setSubjectId] = useState(init?.subjectId ?? subjects[0]?.id ?? "");
  const [examYear, setExamYear] = useState(init?.examYear ?? new Date().getFullYear());
  const [mode, setMode] = useState<ExamMode>(init?.mode ?? "MOCK");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(init?.difficulty ?? "");
  const [durationMinutes, setDuration] = useState<number | "">(init?.durationMinutes ?? 50);
  const [scoringRuleId, setRuleId] = useState(init?.scoringRuleId ?? "");
  const [policy, setPolicy] = useState<ReleasePolicy>(init?.resultReleasePolicy ?? "AFTER_SUBMISSION");
  const [items, setItems] = useState<Picked[]>(() => (initial?.items ?? []).map((i) => ({ questionVersionId: i.questionVersionId, type: i.view.type, view: i.view })));
  const [rules, setRules] = useState<ScoringRuleDto[]>([]);
  const [revision, setRevision] = useState(initial?.revision ?? 0);
  const [busy, setBusy] = useState<null | "save" | "review" | "clone">(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  // picker
  const [pType, setPType] = useState<QuestionType | "">("");
  const [pDiff, setPDiff] = useState<Difficulty | "">("");
  const [pQ, setPQ] = useState("");
  const [pQuery, setPQuery] = useState("");
  const [pPage, setPPage] = useState(1);
  const [pRows, setPRows] = useState<PickerRow[] | null>(null);
  const [pTotal, setPTotal] = useState(0);

  const status = initial?.status ?? "DRAFT";
  const editable = !initial || status === "DRAFT" || status === "REJECTED";
  const rule = rules.find((r) => r.id === scoringRuleId);

  useEffect(() => {
    if (!subjectId) return;
    const ctrl = new AbortController();
    apiFetch<ScoringRuleDto[]>(`/api/admin/scoring-rules?subjectId=${subjectId}&published=1`, { signal: ctrl.signal })
      .then((r) => {
        const list = r.ok ? r.data.filter((x) => x.status === "PUBLISHED") : [];
        setRules(list);
        setRuleId((cur) => (list.some((x) => x.id === cur) ? cur : list[0]?.id ?? ""));
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [subjectId]);

  useEffect(() => {
    if (!editable || !subjectId) return;
    const ctrl = new AbortController();
    const q = new URLSearchParams({ subjectId, page: String(pPage), limit: "10" });
    if (pType) q.set("type", pType);
    if (pDiff) q.set("difficulty", pDiff);
    if (pQuery) q.set("q", pQuery);
    apiFetch<PickerRow[]>(`/api/manage/question-picker?${q}`, { signal: ctrl.signal })
      .then((r) => {
        if (r.ok) {
          setPRows(r.data);
          setPTotal(Number(r.meta?.total ?? 0));
        } else setPRows([]);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [subjectId, pPage, pType, pDiff, pQuery, editable]);

  const total = useMemo(() => {
    if (!rule) return null;
    return items.reduce((acc, it) => {
      const pts = it.type === "SINGLE_CHOICE" ? rule.typeRules.SINGLE_CHOICE.points : it.type === "SHORT_ANSWER" ? rule.typeRules.SHORT_ANSWER.points : rule.typeRules.TRUE_FALSE.pointsByCorrectCount[4];
      return acc.plus(pts);
    }, new Decimal(0));
  }, [items, rule]);
  const typesNotInRule = rule ? items.filter((i) => !rule.sections.some((s) => s.questionType === i.type)).length : 0;

  const payload = () => ({
    title,
    description,
    subjectId,
    examYear: Number(examYear),
    mode,
    difficulty: difficulty || null,
    durationMinutes: durationMinutes === "" ? null : Number(durationMinutes),
    scoringRuleId,
    resultReleasePolicy: policy,
    items: items.map((i) => ({ questionVersionId: i.questionVersionId })),
  });

  const save = async (): Promise<string | null> => {
    const p = payload();
    const parsed = examDraftSchema.safeParse(p);
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((i) => `${i.path.join(" › ") || "Dữ liệu"}: ${i.message}`));
      return null;
    }
    setIssues([]);
    if (!initial) {
      const r = await apiFetch<{ id: string }>("/api/manage/exams", { body: p });
      if (!r.ok) {
        toast.error(r.error.message);
        return null;
      }
      return r.data.id;
    }
    const r = await apiFetch<{ revision: number }>(`/api/manage/exams/${initial.id}`, { method: "PATCH", body: { revision, input: p } });
    if (!r.ok) {
      toast.error(r.error.code === "REVISION_CONFLICT" ? "Đề đã được sửa ở nơi khác. Hãy tải lại trang." : r.error.message);
      return null;
    }
    setRevision(r.data.revision);
    return initial.id;
  };

  const onSave = async () => {
    setBusy("save");
    const id = await save();
    setBusy(null);
    if (!id) return;
    toast.success("Đã lưu nháp.");
    if (!initial) router.replace(`/giao-vien/de-thi/${id}`);
    else router.refresh();
  };

  const onReview = async () => {
    setBusy("review");
    const id = await save();
    if (!id) return setBusy(null);
    const r = await apiFetch(`/api/manage/exams/${id}/submit-review`, { method: "POST", body: {} });
    setBusy(null);
    if (!r.ok) return void toast.error(r.error.message);
    toast.success("Đã gửi quản trị viên duyệt.");
    router.replace(`/giao-vien/de-thi/${id}`);
    router.refresh();
  };

  const onClone = async () => {
    if (!initial) return;
    setBusy("clone");
    const r = await apiFetch<{ id: string }>(`/api/manage/exams/${initial.id}/clone`, { method: "POST", body: {} });
    setBusy(null);
    if (!r.ok) return void toast.error(r.error.message);
    toast.success("Đã tạo bản nháp mới từ đề này.");
    router.push(`/giao-vien/de-thi/${r.data.id}`);
  };

  const move = (i: number, d: -1 | 1) => setItems((prev) => {
    const next = [...prev];
    const j = i + d;
    if (j < 0 || j >= next.length) return prev;
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  });

  return (
    <div className="grid grid-cols-1 gap-6">
      {initial ? (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="exam" status={status} />
          {!editable ? <span className="text-sm text-muted-foreground">Đề đã gửi duyệt/xuất bản nên không sửa trực tiếp. Hãy nhân bản để tạo bản nháp mới.</span> : null}
          {!editable ? <Button size="sm" variant="outline" onClick={() => void onClone()} disabled={busy !== null}>{busy === "clone" ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}Nhân bản</Button> : null}
        </div>
      ) : null}
      {initial?.status === "REJECTED" && initial.reviewNotes ? <FormMessage kind="error">Lý do từ chối: {initial.reviewNotes}</FormMessage> : null}
      {issues.length ? <FormMessage kind="error"><ul className="list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul></FormMessage> : null}

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin đề</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-1.5 sm:col-span-2"><Label htmlFor="e-title">Tên đề *</Label><Input id="e-title" value={title} disabled={!editable} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid grid-cols-1 gap-1.5 sm:col-span-2"><Label htmlFor="e-desc">Mô tả</Label><Textarea id="e-desc" rows={3} value={description} disabled={!editable} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="e-subject">Môn học</Label>
            <select id="e-subject" className={selectClass} value={subjectId} disabled={!editable || Boolean(initial)} onChange={(e) => { setSubjectId(e.target.value); setItems([]); setPPage(1); }}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="e-year">Năm thi</Label><Input id="e-year" type="number" min={2020} max={2100} value={examYear} disabled={!editable} onChange={(e) => setExamYear(Number(e.target.value))} /></div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="e-mode">Hình thức</Label>
            <select id="e-mode" className={selectClass} value={mode} disabled={!editable} onChange={(e) => setMode(e.target.value as ExamMode)}>
              {(["MOCK", "PRACTICE"] as const).map((m) => <option key={m} value={m}>{EXAM_MODE_LABELS[m]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="e-dur">Thời gian (phút){mode === "MOCK" ? " *" : ""}</Label><Input id="e-dur" type="number" min={5} max={300} value={durationMinutes} disabled={!editable} onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="e-diff">Độ khó</Label>
            <select id="e-diff" className={selectClass} value={difficulty} disabled={!editable} onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}>
              <option value="">Không ghi</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="e-rule">Quy tắc tính điểm *</Label>
            <select id="e-rule" className={selectClass} value={scoringRuleId} disabled={!editable} onChange={(e) => setRuleId(e.target.value)}>
              {rules.length === 0 ? <option value="">Môn này chưa có quy tắc đã xuất bản</option> : null}
              {rules.map((r) => <option key={r.id} value={r.id}>{r.name} (năm {r.examYear}, v{r.version})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:col-span-2"><Label htmlFor="e-policy">Công bố đáp án</Label>
            <select id="e-policy" className={selectClass} value={policy} disabled={!editable} onChange={(e) => setPolicy(e.target.value as ReleasePolicy)}>
              {RELEASE_POLICIES.map((p) => <option key={p} value={p}>{RELEASE_POLICY_LABELS[p]}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Đề thuộc kỳ xếp hạng đang diễn ra luôn ẩn đáp án cho tới khi kỳ kết thúc.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Câu hỏi trong đề ({items.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)} disabled={!items.length}><Eye className="size-4" />Xem trước</Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            <p className="text-sm text-muted-foreground">
              Tổng điểm thô tối đa: <strong className="text-foreground">{total ? total.toString() : "—"}</strong> (quy đổi về thang 10 khi chấm). Khi lưu, câu hỏi được xếp theo phần của quy tắc tính điểm.
            </p>
            {typesNotInRule ? <FormMessage kind="error">{typesNotInRule} câu có dạng không nằm trong quy tắc tính điểm đã chọn.</FormMessage> : null}
            {items.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có câu hỏi. Thêm từ ngân hàng câu hỏi đã duyệt bên cạnh.</p> : (
              <ol className="grid grid-cols-1 gap-2">
                {items.map((it, i) => (
                  <li key={it.questionVersionId} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                    <span className="w-6 shrink-0 font-semibold tabular-nums">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <Badge variant="outline" className="mb-1">{QUESTION_TYPE_LABELS[it.type]}</Badge>
                      <RichText text={(it.view?.stem ?? "").slice(0, 160)} className="line-clamp-2" />
                    </div>
                    {editable ? (
                      <div className="flex shrink-0 gap-0.5">
                        <Button size="icon-sm" variant="ghost" aria-label="Lên" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="size-4" /></Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Xuống" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="size-4" /></Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Bỏ khỏi đề" onClick={() => setItems((p) => p.filter((x) => x.questionVersionId !== it.questionVersionId))}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {editable ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Ngân hàng câu hỏi đã duyệt</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <form className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(e) => { e.preventDefault(); setPPage(1); setPQuery(pQ.trim()); }}>
                <Input value={pQ} onChange={(e) => setPQ(e.target.value)} placeholder="Tìm theo nội dung đề bài…" aria-label="Tìm câu hỏi" />
                <Button type="submit" variant="outline"><Search className="size-4" />Tìm</Button>
              </form>
              <div className="grid grid-cols-2 gap-2">
                <select aria-label="Lọc dạng câu" className={selectClass} value={pType} onChange={(e) => { setPType(e.target.value as QuestionType | ""); setPPage(1); }}>
                  <option value="">Mọi dạng</option>
                  {(subjects.find((s) => s.id === subjectId)?.allowedQuestionTypes ?? []).map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
                </select>
                <select aria-label="Lọc độ khó" className={selectClass} value={pDiff} onChange={(e) => { setPDiff(e.target.value as Difficulty | ""); setPPage(1); }}>
                  <option value="">Mọi độ khó</option>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
                </select>
              </div>
              {pRows === null ? <p className="text-sm text-muted-foreground">Đang tải…</p> : pRows.length === 0 ? <p className="text-sm text-muted-foreground">Không có câu hỏi đã duyệt phù hợp.</p> : (
                <ul className="grid grid-cols-1 gap-2">
                  {pRows.map((r) => {
                    const added = items.some((i) => i.questionVersionId === r.questionVersionId);
                    return (
                      <li key={r.questionVersionId} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap gap-1"><Badge variant="outline">{QUESTION_TYPE_LABELS[r.type]}</Badge><Badge variant="outline">{DIFFICULTY_LABELS[r.difficulty]}</Badge>{r.isDemo ? <Badge variant="outline">DEMO</Badge> : null}</div>
                          <RichText text={(r.view?.stem ?? "").slice(0, 160)} className="line-clamp-2" />
                        </div>
                        <Button size="sm" variant={added ? "ghost" : "outline"} disabled={added} onClick={() => setItems((p) => [...p, { questionVersionId: r.questionVersionId, type: r.type, view: r.view }])}>
                          {added ? "Đã thêm" : <><Plus className="size-4" />Thêm</>}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{pTotal} câu</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={pPage <= 1} onClick={() => setPPage((p) => p - 1)}>Trước</Button>
                  <Button size="sm" variant="outline" disabled={pPage * 10 >= pTotal} onClick={() => setPPage((p) => p + 1)}>Sau</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void onSave()} disabled={busy !== null}>{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Lưu nháp</Button>
          <Button variant="secondary" onClick={() => void onReview()} disabled={busy !== null || !items.length}>{busy === "review" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Lưu & gửi duyệt</Button>
        </div>
      ) : null}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Xem trước đề (giao diện học sinh, không có đáp án)</DialogTitle></DialogHeader>
          <ol className="grid grid-cols-1 gap-4">
            {items.map((it, i) => (
              <li key={it.questionVersionId} className="rounded-md border p-3">
                <p className="mb-2 font-semibold">Câu {i + 1}</p>
                {it.view ? <QuestionContent view={it.view} /> : null}
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  );
}
