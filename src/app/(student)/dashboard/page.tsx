import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, PencilLine, PlayCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badges";
import { requirePageActor } from "@/lib/auth/session";
import { formatDateTimeVN, formatScoreScaled } from "@/lib/utils/format";
import { getMyStats, listMyAttempts } from "@/modules/attempts/service";
import { getMyRankingProgress } from "@/modules/rankings/service";

export const metadata: Metadata = { title: "Tổng quan" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const actor = await requirePageActor();
  const [stats, inProgress, recent, ranking] = await Promise.all([
    getMyStats(actor),
    listMyAttempts(actor, { page: 1, limit: 5, status: "IN_PROGRESS" }),
    listMyAttempts(actor, { page: 1, limit: 5, status: "DONE" }),
    getMyRankingProgress(actor),
  ]);

  return (
    <>
      <PageHeader
        title={`Xin chào, ${actor.displayName}!`}
        description="Tiếp tục ôn tập để tiến bộ mỗi ngày."
        actions={
          <>
            <Button asChild><Link href="/luyen-tap"><PencilLine className="size-4" />Luyện tập</Link></Button>
            <Button asChild variant="outline"><Link href="/de-thi"><PlayCircle className="size-4" />Thi thử</Link></Button>
          </>
        }
      />
      {actor.role !== "STUDENT" ? (
        <p className="mb-4 rounded-md border bg-muted p-3 text-sm text-muted-foreground">Bạn đang dùng tài khoản {actor.role === "ADMIN" ? "quản trị viên" : "giáo viên"}: có thể làm bài để trải nghiệm nhưng không tham gia bảng xếp hạng học sinh.</p>
      ) : null}
      <section aria-label="Thống kê" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Bài đã hoàn thành", value: String(stats.completed) },
          { label: "Điểm trung bình", value: stats.averageScaled !== null ? formatScoreScaled(stats.averageScaled) : "—" },
          { label: "Điểm cao nhất", value: stats.bestScaled !== null ? formatScoreScaled(stats.bestScaled) : "—" },
          { label: "Đang làm dở", value: String(stats.inProgress) },
        ].map((s) => (
          <Card key={s.label}><CardContent><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-semibold tabular-nums">{s.value}</p></CardContent></Card>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Bài đang làm dở</CardTitle></CardHeader>
          <CardContent>
            {inProgress.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có bài nào đang làm dở.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {inProgress.items.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                    <div className="min-w-0"><p className="truncate font-medium">{a.title}</p><p className="text-xs text-muted-foreground">Bắt đầu {formatDateTimeVN(a.startedAt)}{a.expiresAt ? ` · hết giờ ${formatDateTimeVN(a.expiresAt)}` : ""}</p></div>
                    <Button asChild size="sm"><Link href={`/lam-bai/${a.id}`}>Tiếp tục</Link></Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Kết quả gần đây</CardTitle></CardHeader>
          <CardContent>
            {recent.items.length === 0 ? (
              <EmptyState className="py-6" title="Chưa có kết quả" description="Hoàn thành một bài luyện tập để xem kết quả tại đây." />
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {recent.items.map((a) => (
                  <li key={a.id}>
                    <Link href={`/ket-qua/${a.id}`} className="flex items-center justify-between gap-2 rounded-md border p-3 hover:bg-accent">
                      <span className="min-w-0"><span className="block truncate font-medium">{a.title}</span><span className="text-xs text-muted-foreground">{formatDateTimeVN(a.finalizedAt)}</span></span>
                      <span className="flex items-center gap-2"><StatusBadge kind="attempt" status={a.status} /><strong className="tabular-nums">{a.scoreScaled !== null ? formatScoreScaled(a.scoreScaled) : "—"}</strong></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trophy className="size-4 text-primary" />Kỳ xếp hạng đang diễn ra</CardTitle></CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hiện chưa có kỳ xếp hạng nào.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {ranking.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                    <span className="min-w-0"><span className="block truncate font-medium">{c.subjectName} · {c.periodLabel}</span><span className="text-muted-foreground">Đã hoàn thành {c.completed}/{c.required} đề</span></span>
                    <Button asChild size="sm" variant="outline"><Link href={`/bang-xep-hang?subjectId=${c.subjectId}&period=${c.periodType}&campaignId=${c.id}`}>Xem</Link></Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4 text-primary" />Theo môn</CardTitle></CardHeader>
          <CardContent>
            {stats.bySubject.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu. <Link href="/mon-hoc" className="text-primary hover:underline">Xem các môn học</Link></p>
            ) : (
              <ul className="grid grid-cols-1 gap-1 text-sm">
                {stats.bySubject.map((s) => (
                  <li key={s.subjectId} className="flex justify-between gap-2 border-b py-1.5 last:border-0"><span>{s.subjectName}</span><span className="text-muted-foreground">{s.attempts} bài · TB <strong className="text-foreground">{formatScoreScaled(s.averageScaled)}</strong></span></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
