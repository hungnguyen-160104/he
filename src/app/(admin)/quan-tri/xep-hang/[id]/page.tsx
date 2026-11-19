import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/states";
import { FormMessage } from "@/components/forms/field";
import { CampaignActions, CampaignStatusBadge } from "@/components/admin/campaigns-manager";
import { StatusBadge } from "@/components/common/status-badges";
import { requirePageActor } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import { formatDateTimeVN } from "@/lib/utils/format";
import { adminGetCampaign } from "@/modules/rankings/service";

export const metadata: Metadata = { title: "Kỳ xếp hạng" };
export const dynamic = "force-dynamic";

export default async function CampaignDetailPage(props: PageProps<"/quan-tri/xep-hang/[id]">) {
  const actor = await requirePageActor(["ADMIN"]);
  const { id } = await props.params;
  let c;
  try {
    c = await adminGetCampaign(actor, id);
  } catch (err) {
    if (isAppError(err) && err.status === 404) notFound();
    throw err;
  }
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/quan-tri/xep-hang" className="text-primary hover:underline">← Danh sách kỳ</Link></p>
      <PageHeader title={c.title} description={`${c.subjectName} · ${c.periodLabel}`} actions={<CampaignActions id={c.id} status={c.status} canFinalize={c.canFinalize} canActivate={c.activation?.ok ?? false} />} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 text-sm">
            <p>Trạng thái: <CampaignStatusBadge status={c.status} isLive={c.isLive} /></p>
            <p>Bắt đầu: <strong>{formatDateTimeVN(c.periodStartAt)}</strong> (giờ Việt Nam)</p>
            <p>Kết thúc: <strong>{formatDateTimeVN(c.periodEndAt)}</strong> (không bao gồm)</p>
            {c.finalizedAt ? <p>Chốt lúc: {formatDateTimeVN(c.finalizedAt)}</p> : null}
            {c.status !== "DRAFT" ? <p>Đã xếp hạng: <strong>{c.completeness.ranked}</strong> học sinh · Chưa đủ đề: <strong>{c.completeness.partial}</strong> học sinh</p> : null}
            {c.status !== "DRAFT" ? <p><Link className="text-primary hover:underline" href={`/bang-xep-hang?subjectId=${c.subjectId}&period=${c.periodType}&campaignId=${c.id}`}>Xem bảng xếp hạng công khai →</Link></p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Bộ đề ({c.exams.length})</CardTitle></CardHeader>
          <CardContent>
            <ol className="grid grid-cols-1 gap-2 text-sm">
              {c.exams.map((e, i) => (
                <li key={e.id} className="flex items-center justify-between gap-2"><span>{i + 1}. <Link href={`/de-thi/${e.id}`} className="text-primary hover:underline">{e.title}</Link></span><StatusBadge kind="exam" status={e.publishStatus} /></li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
      {c.activation ? (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {c.activation.problems.length ? <FormMessage kind="error"><p className="font-medium">Chưa thể kích hoạt:</p><ul className="list-disc pl-5">{c.activation.problems.map((p) => <li key={p}>{p}</li>)}</ul></FormMessage> : <FormMessage kind="success">Kỳ đủ điều kiện kích hoạt.</FormMessage>}
          {c.activation.warnings.length ? <FormMessage kind="info"><ul className="list-disc pl-5">{c.activation.warnings.map((w) => <li key={w}>{w}</li>)}</ul></FormMessage> : null}
        </div>
      ) : null}
    </>
  );
}
