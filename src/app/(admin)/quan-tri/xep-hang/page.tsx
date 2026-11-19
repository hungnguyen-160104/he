import type { Metadata } from "next";
import { PageHeader } from "@/components/common/states";
import { CampaignsManager } from "@/components/admin/campaigns-manager";
import { requirePageActor } from "@/lib/auth/session";
import { adminListCampaigns } from "@/modules/rankings/service";
import { adminListSubjects } from "@/modules/subjects/service";

export const metadata: Metadata = { title: "Kỳ xếp hạng" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const actor = await requirePageActor(["ADMIN"]);
  const [subjects, campaigns] = await Promise.all([adminListSubjects(actor), adminListCampaigns(actor)]);
  return (
    <>
      <PageHeader title="Kỳ xếp hạng" description="Mỗi kỳ gồm bộ đề cố định của một môn trong một tuần/tháng/năm (giờ Việt Nam). Chỉ lượt làm đầu tiên của học sinh được tính." />
      <CampaignsManager subjects={subjects.filter((s) => s.isActive)} campaigns={campaigns} />
    </>
  );
}
