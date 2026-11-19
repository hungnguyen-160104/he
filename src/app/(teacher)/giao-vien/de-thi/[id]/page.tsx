import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/states";
import { ExamBuilder } from "@/components/teacher/exam-builder";
import { requirePageActor } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import { getExamForEditor } from "@/modules/exams/service";
import { adminListSubjects } from "@/modules/subjects/service";

export const metadata: Metadata = { title: "Đề thi" };
export const dynamic = "force-dynamic";

export default async function EditExamPage(props: PageProps<"/giao-vien/de-thi/[id]">) {
  const actor = await requirePageActor(["TEACHER", "ADMIN"]);
  const { id } = await props.params;
  let dto;
  try {
    dto = await getExamForEditor(actor, id);
  } catch (err) {
    if (isAppError(err) && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }
  const subjects = await adminListSubjects(actor);
  return (
    <>
      <PageHeader title={dto.input.title} />
      <ExamBuilder key={`${dto.id}-${dto.revision}`} subjects={subjects} initial={dto} />
    </>
  );
}
