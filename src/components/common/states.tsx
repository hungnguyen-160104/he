import { Construction, Inbox, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-lg border border-dashed bg-card px-6 py-10 text-center", className)}>
      <div className="mb-3 text-muted-foreground">{icon ?? <Inbox className="size-10" aria-hidden="true" />}</div>
      <h2 className="text-lg">{title}</h2>
      {description ? <div className="mt-1 max-w-md text-sm text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/** Phase-1-only notice for modules scheduled in a later phase (see docs/PROGRESS.md). */
export function PhaseNotice({ phase, feature }: { phase: number; feature: string }) {
  return (
    <EmptyState
      icon={<Construction className="size-10" aria-hidden="true" />}
      title={`${feature} đang được xây dựng`}
      description={<>Chức năng này thuộc Phase {phase} trong lộ trình phát triển. Tiến độ xem tại docs/PROGRESS.md.</>}
    />
  );
}

export function ConfigMissingNotice({ what, hint }: { what: string; hint?: string }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm text-warning-foreground">
      <Settings2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">Chưa cấu hình {what}</p>
        <p className="mt-0.5">{hint ?? "Quản trị viên cần điền biến môi trường theo hướng dẫn trong README."}</p>
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
