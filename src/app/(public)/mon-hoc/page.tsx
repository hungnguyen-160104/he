import type { Metadata } from "next";
import { ConfigMissingNotice, EmptyState, PageHeader } from "@/components/common/states";
import { SubjectGrid } from "@/components/subjects/subject-grid";
import { getPublicSubjects, safePublic } from "@/lib/cache/public-data";
import { isDatabaseConfigured } from "@/lib/env";
import { getPublicExamCountsBySubject } from "@/lib/cache/public-exams";

export const metadata: Metadata = { title: "Môn học" };
export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const [subjects, counts] = await Promise.all([safePublic(() => getPublicSubjects()), safePublic(() => getPublicExamCountsBySubject())]);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader title="Môn học" description="Các môn thi tốt nghiệp THPT dạng trắc nghiệm. Ngữ văn (tự luận) chưa hỗ trợ chấm tự động." />
      {!isDatabaseConfigured() ? (
        <ConfigMissingNotice what="cơ sở dữ liệu" />
      ) : !subjects || subjects.length === 0 ? (
        <EmptyState title="Chưa có môn học" description="Quản trị viên có thể thêm môn tại Quản trị → Môn & chủ đề, hoặc chạy pnpm seed:demo để tạo dữ liệu DEMO." />
      ) : (
        <SubjectGrid subjects={subjects} examCounts={counts ?? undefined} />
      )}
    </div>
  );
}
