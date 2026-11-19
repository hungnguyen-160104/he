import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/common/states";
import { ExamBuilder } from "@/components/teacher/exam-builder";
import { requirePageActor } from "@/lib/auth/session";
import { adminListSubjects } from "@/modules/subjects/service";

export const metadata: Metadata = { title: "Tạo đề thi" };
export const dynamic = "force-dynamic";

export default async function NewExamPage() {
  const actor = await requirePageActor(["TEACHER", "ADMIN"]);
  const subjects = (await adminListSubjects(actor)).filter((s) => s.isActive);
  return (
    <>
      <PageHeader title="Tạo đề thi" description="Chọn môn, quy tắc tính điểm và các câu hỏi đã được duyệt." />
      {subjects.length ? <ExamBuilder subjects={subjects} initial={null} /> : <EmptyState title="Chưa có môn học" />}
    </>
  );
}
