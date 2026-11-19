"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { apiFetch, fieldErrorsOf } from "@/lib/api/client";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionType } from "@/modules/questions/types";
import { slugify } from "@/modules/subjects/validation";
import type { SubjectDto, TopicDto } from "@/modules/subjects/service";

type SubjectForm = { id?: string; name: string; slug: string; code: string; allowedQuestionTypes: QuestionType[]; isActive: boolean; sortOrder: number };
const emptySubject: SubjectForm = { name: "", slug: "", code: "", allowedQuestionTypes: ["SINGLE_CHOICE"], isActive: true, sortOrder: 0 };

export function SubjectsManager({ subjects }: { subjects: SubjectDto[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SubjectForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const saveSubject = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    const { id, ...body } = editing;
    const res = id ? await apiFetch(`/api/admin/subjects/${id}`, { method: "PATCH", body }) : await apiFetch("/api/admin/subjects", { body });
    setBusy(false);
    if (!res.ok) {
      const f = fieldErrorsOf(res.error);
      setError(Object.values(f)[0] ?? res.error.message);
      return;
    }
    toast.success("Đã lưu môn học.");
    setEditing(null);
    router.refresh();
  };

  const deleteSubject = async (id: string) => {
    const res = await apiFetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
    if (!res.ok) return void toast.error(res.error.message);
    toast.success("Đã xóa môn học.");
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Button onClick={() => { setError(null); setEditing({ ...emptySubject }); }}><Plus className="size-4" />Thêm môn học</Button>
      </div>
      <ul className="grid grid-cols-1 gap-3">
        {subjects.map((s) => (
          <li key={s.id} className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" className="flex items-center gap-2 text-left" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
                {open === s.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <span>
                  <span className="font-medium">{s.name}</span> <span className="text-sm text-muted-foreground">/{s.slug} · {s.code}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {s.allowedQuestionTypes.map((t) => <Badge key={t} variant="outline">{QUESTION_TYPE_LABELS[t]}</Badge>)}
                    {!s.isActive ? <Badge variant="destructive">Đang tắt</Badge> : null}
                    {s.isDemo ? <Badge variant="outline">DEMO</Badge> : null}
                  </span>
                </span>
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setError(null); setEditing({ id: s.id, name: s.name, slug: s.slug, code: s.code, allowedQuestionTypes: s.allowedQuestionTypes, isActive: s.isActive, sortOrder: s.sortOrder }); }}><Pencil className="size-4" />Sửa</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive" aria-label={`Xóa ${s.name}`}><Trash2 className="size-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Xóa môn “{s.name}”?</AlertDialogTitle><AlertDialogDescription>Chỉ xóa được môn chưa có chủ đề, câu hỏi hay đề thi. Nếu đã có dữ liệu, hãy tắt hoạt động thay vì xóa.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => void deleteSubject(s.id)}>Xóa</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {open === s.id ? <TopicsPanel subjectId={s.id} /> : null}
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Sửa môn học" : "Thêm môn học"}</DialogTitle></DialogHeader>
          {editing ? (
            <div className="grid grid-cols-1 gap-3">
              {error ? <FormMessage kind="error">{error}</FormMessage> : null}
              <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="s-name">Tên môn</Label><Input id="s-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="s-slug">Slug</Label><Input id="s-slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
                <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="s-code">Mã</Label><Input id="s-code" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></div>
              </div>
              <fieldset className="grid grid-cols-1 gap-2"><legend className="text-sm font-medium">Dạng câu hỏi cho phép</legend>
                {QUESTION_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm"><Checkbox checked={editing.allowedQuestionTypes.includes(t)} onCheckedChange={(v) => setEditing({ ...editing, allowedQuestionTypes: v === true ? [...editing.allowedQuestionTypes, t] : editing.allowedQuestionTypes.filter((x) => x !== t) })} />{QUESTION_TYPE_LABELS[t]}</label>
                ))}
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-1 gap-1.5"><Label htmlFor="s-order">Thứ tự hiển thị</Label><Input id="s-order" type="number" min={0} max={1000} value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })} /></div>
                <label className="flex items-center gap-2 self-end text-sm"><Checkbox checked={editing.isActive} onCheckedChange={(v) => setEditing({ ...editing, isActive: v === true })} />Đang hoạt động</label>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={() => void saveSubject()} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TopicsPanel({ subjectId }: { subjectId: string }) {
  const [topics, setTopics] = useState<TopicDto[] | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [grade, setGrade] = useState("");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch<TopicDto[]>(`/api/admin/subjects/${subjectId}/topics`, { signal: ctrl.signal })
      .then((r) => setTopics(r.ok ? r.data : []))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [subjectId, reloadKey]);

  const add = async () => {
    setBusy(true);
    const r = await apiFetch("/api/admin/topics", { body: { subjectId, parentId: parentId || null, name, slug: slugify(name), grade: grade ? Number(grade) : null } });
    setBusy(false);
    if (!r.ok) return void toast.error(r.error.message);
    setName("");
    toast.success("Đã thêm chủ đề.");
    load();
  };
  const toggle = async (t: TopicDto) => {
    const r = await apiFetch(`/api/admin/topics/${t.id}`, { method: "PATCH", body: { isActive: !t.isActive } });
    if (!r.ok) return void toast.error(r.error.message);
    load();
  };
  const remove = async (t: TopicDto) => {
    const r = await apiFetch(`/api/admin/topics/${t.id}`, { method: "DELETE" });
    if (!r.ok) return void toast.error(r.error.message);
    toast.success("Đã xóa chủ đề.");
    load();
  };

  const roots = (topics ?? []).filter((t) => !t.parentId);
  const row = (t: TopicDto, child = false) => (
    <li key={t.id} className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${child ? "ml-6" : ""}`}>
      <span>{t.name} {t.grade ? <span className="text-muted-foreground">· Lớp {t.grade}</span> : null} {!t.isActive ? <Badge variant="destructive">Tắt</Badge> : null}</span>
      <span className="flex gap-1">
        <Button size="xs" variant="ghost" onClick={() => void toggle(t)}>{t.isActive ? "Tắt" : "Bật"}</Button>
        <Button size="xs" variant="ghost" className="text-destructive" onClick={() => void remove(t)} aria-label={`Xóa ${t.name}`}><Trash2 className="size-3" /></Button>
      </span>
    </li>
  );

  return (
    <div className="grid grid-cols-1 gap-3 border-t p-4">
      {topics === null ? <p className="text-sm text-muted-foreground">Đang tải chủ đề…</p> : topics.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có chủ đề.</p> : (
        <ul className="grid grid-cols-1 gap-1.5">
          {roots.map((r) => [row(r), ...(topics ?? []).filter((c) => c.parentId === r.id).map((c) => row(c, true))])}
        </ul>
      )}
      <form className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem_7rem_auto]" onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2) void add(); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên chủ đề mới" aria-label="Tên chủ đề mới" />
        <select aria-label="Chủ đề cha" value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">(Chủ đề gốc)</option>
          {roots.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select aria-label="Lớp" value={grade} onChange={(e) => setGrade(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Mọi lớp</option><option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option>
        </select>
        <Button type="submit" size="sm" disabled={busy || name.trim().length < 2}><Plus className="size-4" />Thêm</Button>
      </form>
    </div>
  );
}
