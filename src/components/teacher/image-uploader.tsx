"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { ALLOWED_IMAGE_MIME, MAX_MEDIA_BYTES } from "@/modules/questions/types";
import type { MediaRef } from "@/modules/questions/validation";

type Signature = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; allowedFormats: string; uploadUrl: string };

/**
 * Signed direct upload to Cloudinary: server signs (folder/formats/timestamp), the browser uploads
 * the bytes directly, then the server verifies the asset before we accept its metadata.
 */
export function ImageUploader({ enabled, onUploaded, disabled }: { enabled: boolean; onUploaded: (m: MediaRef) => void; disabled?: boolean }) {
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!enabled) {
    return (
      <p role="status" className="rounded-md border border-warning/50 bg-warning/10 p-3 text-sm">
        Chưa cấu hình Cloudinary — chưa thể tải ảnh. Câu hỏi không có ảnh vẫn lưu bình thường.
      </p>
    );
  }

  const upload = async (file: File) => {
    if (!(ALLOWED_IMAGE_MIME as readonly string[]).includes(file.type)) return toast.error("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");
    if (file.size > MAX_MEDIA_BYTES) return toast.error("Ảnh vượt quá 3 MB.");
    if (alt.trim().length < 1) return toast.error("Vui lòng nhập mô tả ảnh (alt) trước khi tải lên.");
    setBusy(true);
    try {
      const sig = await apiFetch<Signature>("/api/manage/uploads/signature", { method: "POST", body: {} });
      if (!sig.ok) return void toast.error(sig.error.message);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.data.apiKey);
      form.append("timestamp", String(sig.data.timestamp));
      form.append("signature", sig.data.signature);
      form.append("folder", sig.data.folder);
      form.append("allowed_formats", sig.data.allowedFormats);
      const up = await fetch(sig.data.uploadUrl, { method: "POST", body: form });
      const body = (await up.json().catch(() => null)) as { public_id?: string; error?: { message?: string } } | null;
      if (!up.ok || !body?.public_id) return void toast.error("Tải ảnh lên Cloudinary thất bại. Kiểm tra định dạng/kích thước và thử lại.");
      const verified = await apiFetch<Omit<MediaRef, "alt">>("/api/manage/uploads/verify", { body: { publicId: body.public_id } });
      if (!verified.ok) return void toast.error(verified.error.message);
      onUploaded({ ...verified.data, alt: alt.trim() });
      setAlt("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Đã tải ảnh lên.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border border-dashed p-3">
      <Label htmlFor="img-alt">Mô tả ảnh (alt) *</Label>
      <Input id="img-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} placeholder="Ví dụ: Đồ thị hàm số y = x² trên đoạn [-2; 2]" disabled={disabled || busy} />
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="img-file" disabled={disabled || busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        <Button type="button" variant="outline" size="sm" disabled={disabled || busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Chọn ảnh (JPG/PNG/WebP, ≤ 3 MB)
        </Button>
      </div>
    </div>
  );
}
