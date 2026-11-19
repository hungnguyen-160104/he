import type { Metadata } from "next";
import { PageHeader } from "@/components/common/states";
import { SubjectsManager } from "@/components/admin/subjects-manager";
import { requirePageActor } from "@/lib/auth/session";
import { adminListSubjects } from "@/modules/subjects/service";

export const metadata: Metadata = { title: "Môn học & chủ đề" };
export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const actor = await requirePageActor(["ADMIN"]);
  const subjects = await adminListSubjects(actor);
  return (
    <>
      <PageHeader title="Môn học & chủ đề" description="Cấu hình môn, dạng câu hỏi cho phép và cây chủ đề (tối đa 2 cấp). Không xóa được dữ liệu đã được tham chiếu." />
      <SubjectsManager subjects={subjects} />
    </>
  );
}
