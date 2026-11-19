import type { Metadata } from "next";
import { PageHeader } from "@/components/common/states";
import { ScoringRulesManager } from "@/components/admin/scoring-rules-manager";
import { requirePageActor } from "@/lib/auth/session";
import { listScoringRules } from "@/modules/exams/scoring-service";
import { adminListSubjects } from "@/modules/subjects/service";

export const metadata: Metadata = { title: "Quy tắc tính điểm" };
export const dynamic = "force-dynamic";

export default async function ScoringRulesPage() {
  const actor = await requirePageActor(["ADMIN"]);
  const [subjects, rules] = await Promise.all([adminListSubjects(actor), listScoringRules(actor)]);
  return (
    <>
      <PageHeader title="Quy tắc tính điểm" description="Quy tắc có phiên bản; bản đã xuất bản không thể sửa — muốn thay đổi hãy tạo phiên bản mới." />
      <ScoringRulesManager subjects={subjects} rules={rules} />
    </>
  );
}
