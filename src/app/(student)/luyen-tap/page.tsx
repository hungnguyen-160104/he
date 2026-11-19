import type { Metadata } from "next";
import { PageHeader } from "@/components/common/states";
import { PracticeForm } from "@/components/attempt/practice-form";
import { firstString } from "@/components/common/pagination-links";
import { requirePageActor } from "@/lib/auth/session";
import { getPracticeOptions } from "@/modules/attempts/service";

export const metadata: Metadata = { title: "Luyện tập theo chủ đề" };
export const dynamic = "force-dynamic";

export default async function PracticePage(props: PageProps<"/luyen-tap">) {
  await requirePageActor();
  const sp = await props.searchParams;
  const subjects = await getPracticeOptions();
  return (
    <>
      <PageHeader title="Luyện tập theo chủ đề" description="Chọn môn, chủ đề, độ khó và số câu. Câu hỏi được lấy ngẫu nhiên từ ngân hàng đã duyệt." />
      <PracticeForm subjects={subjects} initialSubjectId={firstString(sp.subjectId)} />
    </>
  );
}
