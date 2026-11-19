/* eslint-disable @next/next/no-img-element -- verified Cloudinary thumbnails */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Archive, Loader2, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { StatusBadge } from "@/components/common/status-badges";
import { QuestionContent } from "@/components/questions/question-content";
import { AnswerKey, Explanation } from "@/components/questions/answer-key";
import { ImageUploader } from "./image-uploader";
import { apiFetch } from "@/lib/api/client";
import { findLatexErrors } from "@/lib/rich-text/parse";
import { DIFFICULTIES, DIFFICULTY_LABELS, OPTION_IDS, QUESTION_TYPE_LABELS, STATEMENT_IDS, type QuestionType } from "@/modules/questions/types";
import { questionInputSchema, type MediaRef } from "@/modules/questions/validation";
import type { QuestionEditorDto, StudentQuestionView } from "@/modules/questions/dto";
import type { SubjectDto, TopicDto } from "@/modules/subjects/service";

type OptionId = (typeof OPTION_IDS)[number];
type StatementId = (typeof STATEMENT_IDS)[number];

type State = {
  subjectId: string;
  topicIds: string[];
  difficulty: (typeof DIFFICULTIES)[number];
  tags: string;
  type: QuestionType;
  stem: string;
  options: Record<OptionId, string>;
  statements: Record<StatementId, string>;
  media: MediaRef[];
  correctOptionId: OptionId | "";
  tfValues: Record<StatementId, boolean | null>;
  saAnswerType: "NUMBER" | "TEXT";
  saAccepted: string;
  saTolerance: string;
  saCaseSensitive: boolean;
  explanation: string;
};

function fromDto(dto: QuestionEditorDto | null, subjects: SubjectDto[]): State {
  const base: State = {
    subjectId: subjects[0]?.id ?? "",
    topicIds: [],
    difficulty: "MEDIUM",
    tags: "",
    type: subjects[0]?.allowedQuestionTypes[0] ?? "SINGLE_CHOICE",
    stem: "",
    options: { A: "", B: "", C: "", D: "" },
    statements: { a: "", b: "", c: "", d: "" },
    media: [],
    correctOptionId: "",
    tfValues: { a: null, b: null, c: null, d: null },
    saAnswerType: "NUMBER",
    saAccepted: "",
    saTolerance: "",
    saCaseSensitive: false,
    explanation: "",
  };
  if (!dto) return base;
  const body = dto.body as { type: QuestionType; content: Record<string, unknown>; key: Record<string, unknown> | null; explanation: string };
  const c = body.content;
  const k = body.key ?? {};
  const s: State = { ...base, subjectId: dto.meta.subjectId, topicIds: dto.meta.topicIds, difficulty: dto.meta.difficulty, tags: dto.meta.tags.join(", "), type: body.type, stem: String(c.stem ?? ""), media: (c.media as MediaRef[]) ?? [], explanation: body.explanation ?? "" };
  if (body.type === "SINGLE_CHOICE") {
    for (const o of (c.options as { id: OptionId; text: string }[]) ?? []) s.options[o.id] = o.text;
    s.correctOptionId = (k.correctOptionId as OptionId) ?? "";
  } else if (body.type === "TRUE_FALSE") {
    for (const st of (c.statements as { id: StatementId; text: string }[]) ?? []) s.statements[st.id] = st.text;
    s.tfValues = { ...base.tfValues, ...((k.values as Record<StatementId, boolean>) ?? {}) };
  } else {
    s.saAnswerType = (k.answerType as "NUMBER" | "TEXT") ?? "NUMBER";
    s.saAccepted = ((k.acceptedAnswers as string[]) ?? []).join("\n");
    s.saTolerance = (k.tolerance as string) ?? "";
    s.saCaseSensitive = Boolean(k.caseSensitive);
  }
  return s;
}

function toPayload(s: State) {
  const tags = s.tags.split(",").map((t) => t.trim()).filter(Boolean);
  const meta = { subjectId: s.subjectId, topicIds: s.topicIds, difficulty: s.difficulty, tags };
  const media = s.media;
  if (s.type === "SINGLE_CHOICE") {
    return { meta, body: { type: s.type, content: { stem: s.stem, options: OPTION_IDS.map((id) => ({ id, text: s.options[id] })), media }, key: { correctOptionId: s.correctOptionId || undefined }, explanation: s.explanation } };
  }
  if (s.type === "TRUE_FALSE") {
    return { meta, body: { type: s.type, content: { stem: s.stem, statements: STATEMENT_IDS.map((id) => ({ id, text: s.statements[id] })), media }, key: { values: s.tfValues }, explanation: s.explanation } };
  }
  return {
    meta,
    body: {
      type: s.type,
      content: { stem: s.stem, media },
      key: { answerType: s.saAnswerType, acceptedAnswers: s.saAccepted.split("\n").map((a) => a.trim()).filter(Boolean), tolerance: s.saTolerance.trim() || null, caseSensitive: s.saCaseSensitive },
      explanation: s.explanation,
    },
  };
}

function previewView(s: State): StudentQuestionView {
  const media = s.media.map((m) => ({ secureUrl: m.secureUrl, width: m.width, height: m.height, alt: m.alt }));
  if (s.type === "SINGLE_CHOICE") return { type: s.type, stem: s.stem, options: OPTION_IDS.map((id) => ({ id, text: s.options[id] })), media };
  if (s.type === "TRUE_FALSE") return { type: s.type, stem: s.stem, statements: STATEMENT_IDS.map((id) => ({ id, text: s.statements[id] })), media };
  return { type: "SHORT_ANSWER", stem: s.stem, media };
}

export function QuestionEditor({ subjects, initial, cloudinaryEnabled }: { subjects: SubjectDto[]; initial: QuestionEditorDto | null; cloudinaryEnabled: boolean }) {
  const router = useRouter();
  const [s, setS] = useState<State>(() => fromDto(initial, subjects));
  const [revision, setRevision] = useState(initial?.revision ?? 0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "review" | "archive">(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const isNew = !initial;
  const status = initial?.status ?? "DRAFT";
  const readOnly = status === "ARCHIVED";
  const subject = subjects.find((x) => x.id === s.subjectId);

  const update = <K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  useEffect(() => {
    if (!s.subjectId) return;
    const ctrl = new AbortController();
    apiFetch<TopicDto[]>(`/api/admin/subjects/${s.subjectId}/topics`, { signal: ctrl.signal }).then((r) => setTopics(r.ok ? r.data : [])).catch(() => undefined);
    return () => ctrl.abort();
  }, [s.subjectId]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const latexErrors = useMemo(() => {
    const texts = [s.stem, s.explanation, ...(s.type === "SINGLE_CHOICE" ? Object.values(s.options) : s.type === "TRUE_FALSE" ? Object.values(s.statements) : [])];
    return [...new Set(texts.flatMap((t) => findLatexErrors(t)))];
  }, [s]);

  const save = async (): Promise<string | null> => {
    const payload = toPayload(s);
    const parsed = questionInputSchema.safeParse(payload);
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((i) => `${i.path.slice(1).join(" › ") || "Dữ liệu"}: ${i.message}`));
      toast.error("Câu hỏi chưa hợp lệ, vui lòng kiểm tra các mục được liệt kê.");
      return null;
    }
    setIssues([]);
    if (isNew) {
      const res = await apiFetch<{ id: string }>("/api/manage/questions", { body: payload });
      if (!res.ok) {
        toast.error(res.error.message);
        return null;
      }
      setDirty(false);
      return res.data.id;
    }
    const res = await apiFetch<{ revision: number; versionNumber: number; createdNewVersion: boolean }>(`/api/manage/questions/${initial.id}`, { method: "PATCH", body: { ...payload, revision } });
    if (!res.ok) {
      toast.error(res.error.code === "REVISION_CONFLICT" ? "Câu hỏi đã được sửa ở nơi khác. Hãy tải lại trang trước khi lưu." : res.error.message);
      return null;
    }
    setRevision(res.data.revision);
    setDirty(false);
    if (res.data.createdNewVersion) toast.info(`Đã tạo phiên bản mới v${res.data.versionNumber}. Phiên bản đã duyệt trước đó vẫn giữ nguyên.`);
    return initial.id;
  };

  const onSave = async () => {
    setBusy("save");
    const id = await save();
    setBusy(null);
    if (!id) return;
    toast.success("Đã lưu nháp.");
    if (isNew) router.replace(`/giao-vien/cau-hoi/${id}`);
    else router.refresh();
  };

  const onReview = async () => {
    setBusy("review");
    const id = dirty || isNew ? await save() : initial!.id;
    if (!id) return setBusy(null);
    const res = await apiFetch(`/api/manage/questions/${id}/request-review`, { method: "POST", body: {} });
    setBusy(null);
    if (!res.ok) return void toast.error(res.error.message);
    toast.success("Đã gửi quản trị viên duyệt.");
    router.replace(`/giao-vien/cau-hoi/${id}`);
    router.refresh();
  };

  const onArchive = async () => {
    if (!initial) return;
    setBusy("archive");
    const res = await apiFetch(`/api/manage/questions/${initial.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return void toast.error(res.error.message);
    setDirty(false);
    toast.success("Đã lưu trữ câu hỏi.");
    router.push("/giao-vien/cau-hoi");
  };

  const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="min-w-0">
        {initial ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge kind="question" status={status} />
            <span className="text-muted-foreground">Phiên bản v{initial.latestVersionNumber}{initial.publishedVersionNumber ? ` · bản đã duyệt: v${initial.publishedVersionNumber}` : ""}</span>
          </div>
        ) : null}
        {initial?.status === "REJECTED" && initial.reviewNotes ? <div className="mb-4"><FormMessage kind="error">Lý do từ chối: {initial.reviewNotes}</FormMessage></div> : null}
        {initial?.latestVersionImmutable ? <div className="mb-4"><FormMessage kind="info">Phiên bản hiện tại đã được duyệt/được dùng trong đề nên không thể sửa trực tiếp. Khi lưu thay đổi, hệ thống tạo phiên bản mới cần duyệt lại; bài làm cũ vẫn giữ đúng phiên bản đã dùng.</FormMessage></div> : null}
        {issues.length ? (
          <div className="mb-4"><FormMessage kind="error"><ul className="list-disc pl-5">{issues.slice(0, 8).map((i) => <li key={i}>{i}</li>)}</ul></FormMessage></div>
        ) : null}

        <Tabs defaultValue="info">
          <TabsList className="scrollbar-none w-full justify-start overflow-x-auto">
            <TabsTrigger value="info">1. Thông tin</TabsTrigger>
            <TabsTrigger value="content">2. Nội dung</TabsTrigger>
            <TabsTrigger value="answer">3. Đáp án & lời giải</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid grid-cols-1 gap-1.5">
                <Label htmlFor="q-subject">Môn học</Label>
                <select id="q-subject" className={selectClass} value={s.subjectId} disabled={!isNew || readOnly} onChange={(e) => { const sub = subjects.find((x) => x.id === e.target.value); setS((p) => ({ ...p, subjectId: e.target.value, topicIds: [], type: sub?.allowedQuestionTypes.includes(p.type) ? p.type : sub?.allowedQuestionTypes[0] ?? p.type })); setDirty(true); }}>
                  {subjects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Label htmlFor="q-type">Dạng câu hỏi</Label>
                <select id="q-type" className={selectClass} value={s.type} disabled={!isNew || readOnly} onChange={(e) => update("type", e.target.value as QuestionType)}>
                  {(subject?.allowedQuestionTypes ?? []).map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Label htmlFor="q-diff">Độ khó</Label>
                <select id="q-diff" className={selectClass} value={s.difficulty} disabled={readOnly} onChange={(e) => update("difficulty", e.target.value as State["difficulty"])}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Label htmlFor="q-tags">Thẻ (phân cách bằng dấu phẩy)</Label>
                <Input id="q-tags" value={s.tags} disabled={readOnly} onChange={(e) => update("tags", e.target.value)} placeholder="đạo hàm, cực trị" />
              </div>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Chủ đề (tối đa 5)</legend>
              {topics.length === 0 ? <p className="text-sm text-muted-foreground">Môn này chưa có chủ đề.</p> : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {topics.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <Checkbox disabled={readOnly} checked={s.topicIds.includes(t.id)} onCheckedChange={(v) => update("topicIds", v === true ? [...s.topicIds, t.id].slice(0, 5) : s.topicIds.filter((x) => x !== t.id))} />
                      {t.parentId ? "— " : ""}{t.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </TabsContent>

          <TabsContent value="content" className="mt-4 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-1.5">
              <Label htmlFor="q-stem">Đề bài</Label>
              <Textarea id="q-stem" rows={6} value={s.stem} disabled={readOnly} onChange={(e) => update("stem", e.target.value)} placeholder="Nhập đề bài. Công thức đặt trong $...$ (cùng dòng) hoặc $$...$$ (dòng riêng), ví dụ: $\frac{1}{2}x^2$" />
              <p className="text-xs text-muted-foreground">Không hỗ trợ HTML. Dùng \$ để viết ký hiệu $.</p>
            </div>
            {s.type === "SINGLE_CHOICE" ? OPTION_IDS.map((id) => (
              <div key={id} className="grid grid-cols-1 gap-1.5">
                <Label htmlFor={`opt-${id}`}>Phương án {id}</Label>
                <Input id={`opt-${id}`} value={s.options[id]} disabled={readOnly} onChange={(e) => update("options", { ...s.options, [id]: e.target.value })} />
              </div>
            )) : null}
            {s.type === "TRUE_FALSE" ? STATEMENT_IDS.map((id) => (
              <div key={id} className="grid grid-cols-1 gap-1.5">
                <Label htmlFor={`st-${id}`}>Ý {id})</Label>
                <Input id={`st-${id}`} value={s.statements[id]} disabled={readOnly} onChange={(e) => update("statements", { ...s.statements, [id]: e.target.value })} />
              </div>
            )) : null}
            <div className="grid grid-cols-1 gap-2">
              <p className="text-sm font-medium">Hình minh họa (tối đa 3)</p>
              {s.media.length ? (
                <ul className="flex flex-wrap gap-3">
                  {s.media.map((m) => (
                    <li key={m.publicId} className="grid grid-cols-1 w-40 gap-1 text-xs">
                      <img src={m.secureUrl} alt={m.alt} className="h-24 w-40 rounded border object-contain" />
                      <span className="truncate" title={m.alt}>{m.alt}</span>
                      {!readOnly ? <Button type="button" variant="ghost" size="xs" onClick={() => update("media", s.media.filter((x) => x.publicId !== m.publicId))}><Trash2 className="size-3" />Gỡ ảnh</Button> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.media.length < 3 && !readOnly ? <ImageUploader enabled={cloudinaryEnabled} onUploaded={(m) => update("media", [...s.media, m])} /> : null}
            </div>
          </TabsContent>

          <TabsContent value="answer" className="mt-4 grid grid-cols-1 gap-4">
            {s.type === "SINGLE_CHOICE" ? (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Đáp án đúng</legend>
                <div className="flex flex-wrap gap-3">
                  {OPTION_IDS.map((id) => (
                    <label key={id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input type="radio" name="correct" disabled={readOnly} checked={s.correctOptionId === id} onChange={() => update("correctOptionId", id)} className="size-4" />{id}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {s.type === "TRUE_FALSE" ? (
              <fieldset className="grid grid-cols-1 gap-2">
                <legend className="mb-1 text-sm font-medium">Đúng/Sai cho từng ý</legend>
                {STATEMENT_IDS.map((id) => (
                  <div key={id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 font-semibold">{id})</span>
                    {([true, false] as const).map((v) => (
                      <label key={String(v)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5">
                        <input type="radio" name={`tf-${id}`} disabled={readOnly} checked={s.tfValues[id] === v} onChange={() => update("tfValues", { ...s.tfValues, [id]: v })} className="size-4" />{v ? "Đúng" : "Sai"}
                      </label>
                    ))}
                  </div>
                ))}
              </fieldset>
            ) : null}
            {s.type === "SHORT_ANSWER" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid grid-cols-1 gap-1.5">
                  <Label htmlFor="sa-type">Kiểu đáp án</Label>
                  <select id="sa-type" className={selectClass} value={s.saAnswerType} disabled={readOnly} onChange={(e) => update("saAnswerType", e.target.value as "NUMBER" | "TEXT")}>
                    <option value="NUMBER">Số</option>
                    <option value="TEXT">Chuỗi ký tự</option>
                  </select>
                </div>
                {s.saAnswerType === "NUMBER" ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    <Label htmlFor="sa-tol">Sai số cho phép (không bắt buộc)</Label>
                    <Input id="sa-tol" value={s.saTolerance} disabled={readOnly} onChange={(e) => update("saTolerance", e.target.value)} placeholder="Ví dụ 0.01 (để trống = phải đúng tuyệt đối)" />
                  </div>
                ) : (
                  <label className="flex items-center gap-2 self-end text-sm"><Checkbox disabled={readOnly} checked={s.saCaseSensitive} onCheckedChange={(v) => update("saCaseSensitive", v === true)} />Phân biệt hoa/thường</label>
                )}
                <div className="grid grid-cols-1 gap-1.5 sm:col-span-2">
                  <Label htmlFor="sa-acc">Các đáp án chấp nhận (mỗi dòng một đáp án)</Label>
                  <Textarea id="sa-acc" rows={3} value={s.saAccepted} disabled={readOnly} onChange={(e) => update("saAccepted", e.target.value)} placeholder={s.saAnswerType === "NUMBER" ? "1,5\n-2" : "Hà Nội"} />
                  <p className="text-xs text-muted-foreground">Số: dấu phẩy và dấu chấm thập phân được xem như nhau (1,5 = 1.5) nhưng khác 15. Không dùng phân cách hàng nghìn.</p>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-1.5">
              <Label htmlFor="q-exp">Lời giải</Label>
              <Textarea id="q-exp" rows={5} value={s.explanation} disabled={readOnly} onChange={(e) => update("explanation", e.target.value)} />
            </div>
          </TabsContent>
        </Tabs>

        {!readOnly ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => void onSave()} disabled={busy !== null}>{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Lưu nháp</Button>
            {status !== "IN_REVIEW" ? <Button variant="secondary" onClick={() => void onReview()} disabled={busy !== null}>{busy === "review" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Lưu & gửi duyệt</Button> : null}
            {initial ? (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" className="text-destructive" disabled={busy !== null}><Archive className="size-4" />Lưu trữ</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Lưu trữ câu hỏi?</AlertDialogTitle><AlertDialogDescription>Câu hỏi sẽ bị ẩn khỏi ngân hàng và không dùng được cho đề mới. Các đề/bài làm đã dùng câu này vẫn giữ nguyên.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => void onArchive()}>Lưu trữ</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            {dirty ? <span className="self-center text-sm text-muted-foreground">Có thay đổi chưa lưu</span> : null}
          </div>
        ) : null}
      </div>

      <aside aria-label="Xem trước" className="xl:sticky xl:top-20 xl:h-fit">
        <Card>
          <CardHeader><CardTitle className="text-base">Xem trước (giao diện học sinh)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {latexErrors.length ? <FormMessage kind="error"><ul className="list-disc pl-4">{latexErrors.slice(0, 5).map((e) => <li key={e}>{e}</li>)}</ul></FormMessage> : null}
            {s.stem.trim() ? <QuestionContent view={previewView(s)} /> : <p className="text-sm text-muted-foreground">Nhập đề bài để xem trước.</p>}
            <div className="border-t pt-3">
              <AnswerKey type={s.type} answer={toPayload(s).body.key} />
              <div className="mt-2"><Explanation text={s.explanation} /></div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
