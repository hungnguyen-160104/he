"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

function newKey() {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Starts (or resumes) an attempt. One idempotency key per click-session prevents double starts. */
export function StartExamButton({ examId, signedIn, label = "Bắt đầu làm bài" }: { examId: string; signedIn: boolean; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const keyRef = useRef<string>(newKey());

  if (!signedIn) {
    return (
      <Button asChild size="lg">
        <Link href={`/dang-nhap?callbackUrl=${encodeURIComponent(`/de-thi/${examId}`)}`}>Đăng nhập để làm bài</Link>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await apiFetch<{ attemptId: string; resumed: boolean }>("/api/attempts", { body: { examId, idempotencyKey: keyRef.current } });
        if (!res.ok) {
          setBusy(false);
          toast.error(res.error.message);
          keyRef.current = newKey();
          return;
        }
        if (res.data.resumed) toast.info("Tiếp tục lượt làm bài đang mở.");
        router.push(`/lam-bai/${res.data.attemptId}`);
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <PlayCircle className="size-4" aria-hidden="true" />}
      {label}
    </Button>
  );
}
