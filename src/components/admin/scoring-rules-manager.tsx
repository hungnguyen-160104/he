"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/forms/field";
import { apiFetch } from "@/lib/api/client";
import { DEMO_SECTIONS, DEMO_TYPE_RULES, scoringRuleInputSchema, type TypeRules } from "@/modules/grading/rule";
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/modules/questions/types";
import type { ScoringRuleDto } from "@/modules/exams/scoring-service";
import type { SubjectDto } from "@/modules/subjects/service";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ScoringRulesManager({ subjects, rules }: { subjects: SubjectDto[]; rules: ScoringRuleDto[] }) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [name, setName] = useState("Quy tắc tính điểm");
  const [examYear, setExamYear] = useState(new Date().getFullYear());
  const [types, setTypes] = useState<QuestionType[]>(subjects[0]?.allowedQuestionTypes ?? []);
  const [tr, setTr] = useState<TypeRules>(DEMO_TYPE_RULES);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const subject = subjects.find((s) => s.id === subjectId);

  const create = async () => {
    const body = {
      name,
      subjectId,
      examYear,
      sections: DEMO_SECTIONS.filter((s) => types.includes(s.questionType)),
      typeRules: tr,
    };
    const parsed = scoringRuleInputSchema.safeParse(body);
    if (!parsed.success) return setError(parsed.error.issues.map((i) => `${i.path.join(" › ")}: ${i.message}`).join("; "));
    setError(null);
    setBusy("create");
    const r = await apiFetch("/api/admin/scoring-rules", { body });
    setBusy(null);
    if (!r.ok) return setError(r.error.message);
    toast.success("Đã tạo quy tắc (nháp). Hãy kiểm tra rồi xuất bản.");
    router.refresh();
  };

  const publish = async (id: string) => {
    setBusy(id);
    const r = await apiFetch(`/api/admin/scoring-rules/${id}/publish`, { method: "POST", body: {} });
    setBusy(null);
    if (!r.ok) return void toast.error(r.error.message);
    toast.success("Đã xuất bản quy tắc. Từ giờ quy tắc này không thể sửa.");
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-label="Danh sách quy tắc" className="grid grid-cols-1 h-fit gap-3">
        {rules.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có quy tắc nào.</p> : rules.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">{r.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{r.subjectName} · năm {r.examYear} · phiên bản {r.version}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.isDemo ? <Badge variant="outline">DEMO</Badge> : null}
                <Badge variant={r.status === "PUBLISHED" ? "secondary" : "outline"}>{r.status === "PUBLISHED" ? "Đã xuất bản" : r.status === "DRAFT" ? "Nháp" : "Lưu trữ"}</Badge>
                {r.status === "DRAFT" ? <Button size="sm" onClick={() => void publish(r.id)} disabled={busy !== null}>{busy === r.id ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Xuất bản</Button> : null}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-1 text-sm">
              {r.sections.map((s) => (
                <p key={s.id}>
                  <strong>{s.title}</strong>:{" "}
                  {s.questionType === "TRUE_FALSE" ? `0/1/2/3/4 ý đúng → ${r.typeRules.TRUE_FALSE.pointsByCorrectCount.join(" / ")} điểm` : `${r.typeRules[s.questionType].points} điểm/câu`}
                </p>
              ))}
              <p className="text-muted-foreground">Điểm bài = điểm đạt / điểm tối đa × 10, làm tròn một lần (half-up) về thang 10.</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="h-fit">
        <CardHeader><CardTitle className="text-base">Tạo phiên bản quy tắc mới</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3">
          <FormMessage kind="info">Giá trị mặc định là cấu hình DEMO theo cấu trúc 3 phần từ năm 2025, không phải văn bản chính thức. Hãy đối chiếu quy định hiện hành của Bộ GD&ĐT.</FormMessage>
          {error ? <FormMessage kind="error">{error}</FormMessage> : null}
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="r-subject">Môn</Label>
            <select id="r-subject" className={selectClass} value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTypes(subjects.find((s) => s.id === e.target.value)?.allowedQuestionTypes ?? []); }}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="r-name">Tên</Label><Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="r-year">Năm áp dụng</Label><Input id="r-year" type="number" min={2020} max={2100} value={examYear} onChange={(e) => setExamYear(Number(e.target.value))} /></div>
          <fieldset className="grid grid-cols-1 gap-2"><legend className="text-sm font-medium">Các phần</legend>
            {(subject?.allowedQuestionTypes ?? []).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm"><Checkbox checked={types.includes(t)} onCheckedChange={(v) => setTypes(v === true ? [...types, t] : types.filter((x) => x !== t))} />{QUESTION_TYPE_LABELS[t]}</label>
            ))}
          </fieldset>
          {types.includes("SINGLE_CHOICE") ? <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="r-sc">Điểm mỗi câu trắc nghiệm nhiều lựa chọn</Label><Input id="r-sc" value={tr.SINGLE_CHOICE.points} onChange={(e) => setTr({ ...tr, SINGLE_CHOICE: { points: e.target.value } })} /></div> : null}
          {types.includes("TRUE_FALSE") ? (
            <fieldset className="grid grid-cols-1 gap-1.5"><legend className="text-sm font-medium">Đúng/sai: điểm theo số ý đúng (0→4)</legend>
              <div className="grid grid-cols-5 gap-1">
                {tr.TRUE_FALSE.pointsByCorrectCount.map((p, i) => (
                  <Input key={i} aria-label={`${i} ý đúng`} value={p} onChange={(e) => { const next = [...tr.TRUE_FALSE.pointsByCorrectCount] as TypeRules["TRUE_FALSE"]["pointsByCorrectCount"]; next[i] = e.target.value; setTr({ ...tr, TRUE_FALSE: { pointsByCorrectCount: next } }); }} />
                ))}
              </div>
            </fieldset>
          ) : null}
          {types.includes("SHORT_ANSWER") ? <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="r-sa">Điểm mỗi câu trả lời ngắn</Label><Input id="r-sa" value={tr.SHORT_ANSWER.points} onChange={(e) => setTr({ ...tr, SHORT_ANSWER: { points: e.target.value } })} /></div> : null}
          <Button onClick={() => void create()} disabled={busy !== null || !types.length}>{busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Tạo (nháp)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
