"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/common/error-state";

export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Digest only; no PII.
    const digest = error && typeof error === "object" && "digest" in error ? (error as { digest?: string }).digest : undefined;
    console.error("ui.error", digest ?? "no-digest");
  }, [error]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <ErrorState description="Trang gặp sự cố khi tải. Vui lòng thử lại hoặc quay lại sau." onRetry={retry} />
    </main>
  );
}
