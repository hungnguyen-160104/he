import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Server-friendly pagination that preserves current query params. */
export function PaginationLinks({ page, totalPages, params, basePath }: { page: number; totalPages: number; params: Record<string, string | undefined>; basePath: string }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp}`;
  };
  return (
    <nav aria-label="Phân trang" className="mt-6 flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">
        Trang {page}/{totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page - 1)}>Trước</Link>
          </Button>
        ) : null}
        {page < totalPages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page + 1)}>Sau</Link>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}

export function firstString(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length ? v : undefined;
}
