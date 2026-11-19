import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/common/states";
import { QuestionEditor } from "@/components/teacher/question-editor";
import { requirePageActor } from "@/lib/auth/session";
import { isCloudinaryConfigured } from "@/lib/env";
import { adminListSubjects } from "@/modules/subjects/service";

export const metadata: Metadata = { title: "Tạo câu hỏi" };
export const dynamic = "force-dynamic";

export default async function NewQuestionPage() {
  const actor = await requirePageActor(["TEACHER", "ADMIN"]);
  const subjects = (await adminListSubjects(actor)).filter((s) => s.isActive);
  return (
    <>
      <PageHeader title="Tạo câu hỏi" description="Soạn nội dung, chọn đáp án và lời giải. Câu hỏi cần được quản trị viên duyệt trước khi dùng cho đề và luyện tập." />
      {subjects.length ? <QuestionEditor subjects={subjects} initial={null} cloudinaryEnabled={isCloudinaryConfigured()} /> : <EmptyState title="Chưa có môn học" description="Quản trị viên cần tạo môn học trước." />}
    </>
  );
}
