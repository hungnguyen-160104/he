"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/field";
import { apiFetch } from "@/lib/api/client";

/** Verification requires an explicit click (link scanners must not consume the token). */
export function VerifyEmail({ token }: { token: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!token) return <FormMessage kind="error">Liên kết xác minh không hợp lệ hoặc đã hết hạn.</FormMessage>;
  if (state === "done") {
    return (
      <div className="grid grid-cols-1 gap-4">
        <FormMessage kind="success">Xác minh email thành công.</FormMessage>
        <Button asChild>
          <Link href="/dang-nhap?notice=verified">Đăng nhập</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      {state === "error" && message ? <FormMessage kind="error">{message}</FormMessage> : null}
      <p className="text-sm text-muted-foreground">Nhấn nút bên dưới để hoàn tất xác minh email cho tài khoản của bạn.</p>
      <Button
        disabled={state === "loading"}
        onClick={async () => {
          setState("loading");
          const res = await apiFetch<{ verified: true }>("/api/auth/verify-email", { body: { token } });
          if (res.ok) setState("done");
          else {
            setMessage(res.error.message);
            setState("error");
          }
        }}
      >
        {state === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Xác minh email
      </Button>
    </div>
  );
}
