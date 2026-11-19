import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfigMissingNotice, EmptyState, PageHeader } from "@/components/common/states";
import { firstString } from "@/components/common/pagination-links";
import { getActor } from "@/lib/auth/session";
import { getPublicSubjects, safePublic } from "@/lib/cache/public-data";
import { isDatabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import { formatDateTimeVN, formatScoreScaled } from "@/lib/utils/format";
import { PERIOD_LABELS, PERIOD_TYPES, type PeriodType } from "@/lib/utils/period";
import { getLeaderboard, listVisibleCampaigns } from "@/modules/rankings/service";

export const metadata: Metadata = { title: "Bảng xếp hạng" };
export const dynamic = "force-dynamic";

const LIMITS = [10, 50, 100] as const;

export default async function LeaderboardPage(props: PageProps<"/bang-xep-hang">) {
  const sp = await props.searchParams;
  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <PageHeader title="Bảng xếp hạng" />
        <ConfigMissingNotice what="cơ sở dữ liệu" />
      </div>
    );
  }
  const subjects = (await safePublic(() => getPublicSubjects())) ?? [];
  const subjectId = firstString(sp.subjectId) ?? subjects[0]?.id;
  const periodType = (PERIOD_TYPES as readonly string[]).includes(firstString(sp.period) ?? "") ? (firstString(sp.period) as PeriodType) : "WEEK";
  const limit = LIMITS.find((l) => String(l) === firstString(sp.limit)) ?? 10;
  const viewer = await getActor().catch(() => null);
  const campaigns = subjectId ? ((await safePublic(() => listVisibleCampaigns({ subjectId, periodType }))) ?? []) : [];
  const requested = firstString(sp.campaignId);
  const selectedId = campaigns.find((c) => c.id === requested)?.id ?? campaigns.find((c) => c.isLive)?.id ?? campaigns[0]?.id;
  const board = selectedId ? await safePublic(() => getLeaderboard(selectedId, { limit, viewerId: viewer?.id ?? null })) : null;
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { subjectId, period: periodType, limit: String(limit), campaignId: selectedId, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/bang-xep-hang?${q}`;
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader title="Bảng xếp hạng" description="Xếp hạng theo điểm trung bình lượt làm đầu tiên của bộ đề trong kỳ. Chỉ hiển thị biệt danh." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Chọn môn">
        {subjects.map((s) => (
          <Button key={s.id} asChild size="sm" variant={s.id === subjectId ? "default" : "outline"}>
            <Link href={href({ subjectId: s.id, campaignId: undefined })}>{s.name}</Link>
          </Button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Chọn kỳ">
        {PERIOD_TYPES.map((p) => (
          <Link
            key={p}
            role="tab"
            aria-selected={p === periodType}
            href={href({ period: p, campaignId: undefined })}
            className={cn("rounded-md px-4 py-2 text-sm font-medium", p === periodType ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}
          >
            {PERIOD_LABELS[p]}
          </Link>
        ))}
        {campaigns.length > 1 ? (
          <form method="get" className="ml-auto flex gap-2">
            <input type="hidden" name="subjectId" value={subjectId ?? ""} />
            <input type="hidden" name="period" value={periodType} />
            <select name="campaignId" defaultValue={selectedId} aria-label="Chọn kỳ xếp hạng" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.periodLabel}{c.isLive ? " (đang diễn ra)" : ""}</option>)}
            </select>
            <Button type="submit" size="sm" variant="outline">Xem</Button>
          </form>
        ) : null}
      </div>

      {!board ? (
        <EmptyState icon={<Trophy className="size-10" aria-hidden="true" />} title="Chưa có kỳ xếp hạng" description="Quản trị viên chưa mở kỳ xếp hạng cho môn và giai đoạn này." />
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{board.campaign.title}</p>
                <p className="text-sm text-muted-foreground">{board.campaign.periodLabel} · {board.campaign.examCount} đề · {board.totalRanked} học sinh đã hoàn thành</p>
              </div>
              {board.campaign.isLive ? <Badge className="w-fit bg-success/15 text-success">Đang diễn ra</Badge> : <Badge variant="secondary" className="w-fit">Đã chốt</Badge>}
            </CardContent>
          </Card>
          {board.me ? (
            <div role="status" className="mb-4 rounded-lg border border-primary/30 bg-accent/50 p-4 text-sm">
              {board.me.rank ? (
                <>Bạn đang xếp hạng <strong>#{board.me.rank}</strong> với điểm trung bình <strong>{formatScoreScaled(board.me.scoreAverageScaled ?? 0)}</strong>.{board.me.hidden ? " (Biệt danh của bạn đang ẩn với người khác.)" : ""}</>
              ) : (
                <>Bạn đã hoàn thành <strong>{board.me.completed}/{board.me.required}</strong> đề của kỳ. Cần hoàn thành tất cả đề (lượt đầu tiên) để được xếp hạng.</>
              )}
              {board.campaign.isLive ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {board.campaign.exams.map((e) => <li key={e.id}><Link className="text-primary hover:underline" href={`/de-thi/${e.id}`}>{e.title}</Link></li>)}
                </ul>
              ) : null}
            </div>
          ) : null}
          {board.entries.length === 0 ? (
            <EmptyState title="Chưa có ai hoàn thành đủ bộ đề" description="Hãy là người đầu tiên!" />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Hạng</TableHead>
                    <TableHead>Học sinh</TableHead>
                    <TableHead className="text-right">Điểm TB</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Hoàn thành lúc</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {board.entries.map((e) => (
                    <TableRow key={e.rank} className={e.isMe ? "bg-accent/60" : undefined}>
                      <TableCell className="font-semibold tabular-nums">#{e.rank}</TableCell>
                      <TableCell>{e.displayName}{e.isMe ? <Badge variant="outline" className="ml-2">Bạn</Badge> : null}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatScoreScaled(e.scoreAverageScaled)}</TableCell>
                      <TableCell className="hidden text-right text-sm text-muted-foreground sm:table-cell">{formatDateTimeVN(e.completedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-3 flex gap-2 text-sm">
            Hiển thị:
            {LIMITS.map((l) => (
              <Link key={l} href={href({ limit: String(l) })} className={cn("hover:underline", l === limit ? "font-semibold text-primary" : "text-muted-foreground")}>Top {l}</Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
