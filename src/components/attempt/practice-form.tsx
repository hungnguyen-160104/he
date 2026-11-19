"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/forms/field";
import { apiFetch } from "@/lib/api/client";
import { DIFFICULTIES, DIFFICULTY_LABELS, QUESTION_TYPE_LABELS, type QuestionType } from "@/modules/questions/types";
import { PRACTICE_MAX, PRACTICE_MIN } from "@/modules/attempts/validation";
import type { TopicDto } from "@/modules/subjects/service";

export type PracticeSubjectOption = {
  id: string;
  name: string;
  allowedQuestionTypes: QuestionType[];
  publishedByType: Partial<Record<QuestionType, number>>;
  totalPublished: number;
  hasScoringRule: boolean;
};

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function PracticeForm({ subjects, initialSubjectId }: { subjects: PracticeSubjectOption[]; initialSubjectId?: string }) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(initialSubjectId && subjects.some((s) => s.id === initialSubjectId) ? initialSubjectId : subjects.find((s) => s.totalPublished > 0)?.id ?? subjects[0]?.id ?? "");
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>("");
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const keyRef = useRef(crypto.randomUUID().replace(/-/g, ""));
  const subject = useMemo(() => subjects.find((s) => s.id === subjectId), [subjects, subjectId]);

  useEffect(() => {
    if (!subjectId) return;
    const ctrl = new AbortController();
    apiFetch<TopicDto[]>(`/api/subjects/${subjectId}/topics`, { signal: ctrl.signal })
      .then((r) => {
        setTopics(r.ok ? r.data : []);
        setTopicIds([]);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [subjectId]);

  const start = async () => {
    setBusy(true);
    setNotice(null);
    const res = await apiFetch<{ attemptId: string; requested: number; actual: number }>("/api/practice/sessions", {
      body: { subjectId, topicIds, difficulty: difficulty || null, types, count, idempotencyKey: keyRef.current },
    });
    if (!res.ok) {
      setBusy(false);
      keyRef.current = crypto.randomUUID().replace(/-/g, "");
      setNotice(res.error.message);
      return;
    }
    if (res.data.actual < res.data.requested) toast.info(`Ngân hàng hiện chỉ có ${res.data.actual} câu phù hợp (bạn chọn ${res.data.requested}).`);
    router.push(`/lam-bai/${res.data.attemptId}`);
  };

  if (!subjects.length) return <FormMessage kind="info">Chưa có môn học nào. Quản trị viên cần thêm môn và câu hỏi trước.</FormMessage>;

  return (
    <div className="grid grid-cols-1 max-w-2xl gap-5 rounded-lg border bg-card p-4 sm:p-6">
      {notice ? <FormMessage kind="error">{notice}</FormMessage> : null}
      <div className="grid grid-cols-1 gap-1.5">
        <Label htmlFor="p-subject">Môn học</Label>
        <select id="p-subject" className={selectClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.totalPublished} câu đã duyệt)</option>)}
        </select>
        {subject && !subject.hasScoringRule ? <p className="text-sm text-destructive">Môn này chưa có quy tắc tính điểm nên chưa thể luyện tập.</p> : null}
        {subject && subject.totalPublished === 0 ? <p className="text-sm text-muted-foreground">Môn này chưa có câu hỏi đã duyệt.</p> : null}
      </div>
      {topics.length ? (
        <fieldset className="grid grid-cols-1 gap-2">
          <legend className="mb-1 text-sm font-medium">Chủ đề (không bắt buộc)</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {topics.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={topicIds.includes(t.id)} onCheckedChange={(v) => setTopicIds((prev) => (v === true ? [...prev, t.id] : prev.filter((x) => x !== t.id)))} />
                {t.parentId ? "— " : ""}{t.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-1 gap-1.5">
          <Label htmlFor="p-diff">Độ khó</Label>
          <select id="p-diff" className={selectClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Mọi độ khó</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          <Label htmlFor="p-count">Số câu ({PRACTICE_MIN}–{PRACTICE_MAX})</Label>
          <Input id="p-count" type="number" min={PRACTICE_MIN} max={PRACTICE_MAX} value={count} onChange={(e) => setCount(Math.min(PRACTICE_MAX, Math.max(PRACTICE_MIN, Number(e.target.value) || PRACTICE_MIN)))} />
        </div>
      </div>
      {subject ? (
        <fieldset className="grid grid-cols-1 gap-2">
          <legend className="mb-1 text-sm font-medium">Dạng câu hỏi (bỏ trống = tất cả)</legend>
          <div className="flex flex-wrap gap-4">
            {subject.allowedQuestionTypes.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox checked={types.includes(t)} onCheckedChange={(v) => setTypes((prev) => (v === true ? [...prev, t] : prev.filter((x) => x !== t)))} />
                {QUESTION_TYPE_LABELS[t]} ({subject.publishedByType[t] ?? 0})
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div>
        <Button size="lg" onClick={() => void start()} disabled={busy || !subject || !subject.hasScoringRule || subject.totalPublished === 0}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}Bắt đầu luyện tập
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">Luyện tập không tính vào bảng xếp hạng và không giới hạn thời gian. Đáp án hiển thị ngay sau khi nộp.</p>
      </div>
    </div>
  );
}
