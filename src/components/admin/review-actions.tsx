"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, EyeOff, Loader2, Unlock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { apiFetch } from "@/lib/api/client";

export function ReviewActions({ kind, id, onDoneHref }: { kind: "question" | "exam"; id: string; onDoneHref?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const base = kind === "question" ? `/api/admin/questions/${id}` : `/api/admin/exams/${id}`;

  const done = (msg: string) => {
    toast.success(msg);
    if (onDoneHref) router.push(onDoneHref);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={busy !== null}
        onClick={async () => {
          setBusy("approve");
          const r = await apiFetch(`${base}/approve`, { method: "POST", body: {} });
          setBusy(null);
          if (!r.ok) return void toast.error(r.error.message);
          done(kind === "exam" ? "Đã duyệt và xuất bản đề." : "Đã duyệt câu hỏi.");
        }}
      >
        {busy === "approve" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Duyệt{kind === "exam" ? " & xuất bản" : ""}
      </Button>
      <Button size="sm" variant="outline" className="text-destructive" disabled={busy !== null} onClick={() => setOpen(true)}>
        <X className="size-4" />Từ chối
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối {kind === "exam" ? "đề" : "câu hỏi"}</DialogTitle>
            <DialogDescription>Giáo viên sẽ thấy lý do để chỉnh sửa và gửi lại.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-1.5">
            <Label htmlFor={`reason-${id}`}>Lý do *</Label>
            <Textarea id={`reason-${id}`} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={busy !== null || reason.trim().length < 5}
              onClick={async () => {
                setBusy("reject");
                const r = await apiFetch(`${base}/reject`, { method: "POST", body: { reason } });
                setBusy(null);
                if (!r.ok) return void toast.error(r.error.message);
                setOpen(false);
                done("Đã từ chối và gửi lý do cho giáo viên.");
              }}
            >
              {busy === "reject" ? <Loader2 className="size-4 animate-spin" /> : null}Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Published-exam admin actions: unpublish (soft) and manual answer release. */
export function PublishedExamActions({ id, canRelease }: { id: string; canRelease: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const call = async (path: string, ok: string) => {
    setBusy(true);
    const r = await apiFetch(`/api/admin/exams/${id}/${path}`, { method: "POST", body: {} });
    setBusy(false);
    if (!r.ok) return void toast.error(r.error.message);
    toast.success(ok);
    router.refresh();
  };
  return (
    <div className="flex flex-wrap gap-2">
      {canRelease ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void call("release-results", "Đã công bố đáp án.")}><Unlock className="size-4" />Công bố đáp án</Button>
      ) : null}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-destructive" disabled={busy}><EyeOff className="size-4" />Gỡ xuất bản</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ đề khỏi danh sách công khai?</AlertDialogTitle>
            <AlertDialogDescription>Học sinh sẽ không bắt đầu được lượt mới. Lịch sử và kết quả đã có được giữ nguyên. Không thể gỡ đề đang thuộc kỳ xếp hạng đang diễn ra.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => void call("unpublish", "Đã gỡ đề.")}>Gỡ xuất bản</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
