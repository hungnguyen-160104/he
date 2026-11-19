import { ConfigMissingNotice, EmptyState } from "@/components/common/states";
import { ExamGrid } from "@/components/exams/exam-card";
import { SubjectGrid } from "@/components/subjects/subject-grid";
import { getPublicSubjects, safePublic } from "@/lib/cache/public-data";
import { getPublicExamCountsBySubject, getPublicExamList } from "@/lib/cache/public-exams";
import { isDatabaseConfigured } from "@/lib/env";

export async function HomeSubjects() {
  if (!isDatabaseConfigured()) return <ConfigMissingNotice what="cơ sở dữ liệu" />;
  const [subjects, counts] = await Promise.all([safePublic(() => getPublicSubjects()), safePublic(() => getPublicExamCountsBySubject())]);
  if (!subjects?.length) {
    return <EmptyState title="Chưa có môn học" description="Quản trị viên có thể thêm môn học hoặc tạo dữ liệu DEMO bằng lệnh pnpm seed:demo." />;
  }
  return <SubjectGrid subjects={subjects.slice(0, 6)} examCounts={counts ?? undefined} />;
}

export async function HomeLatestExams() {
  if (!isDatabaseConfigured()) return null;
  const list = await safePublic(() => getPublicExamList({ page: 1, limit: 6 }));
  if (!list?.items.length) {
    return <EmptyState title="Chưa có đề thi" description="Đề thi sẽ xuất hiện tại đây sau khi giáo viên soạn và quản trị viên duyệt." />;
  }
  return <ExamGrid exams={list.items} />;
}
