import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/states";
import { QuestionEditor } from "@/components/teacher/question-editor";
import { requirePageActor } from "@/lib/auth/session";
import { isCloudinaryConfigured } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import { getQuestionForEditor } from "@/modules/questions/service";
import { adminListSubjects } from "@/modules/subjects/service";

export const metadata: Metadata = { title: "Sửa câu hỏi" };
export const dynamic = "force-dynamic";

export default async function EditQuestionPage(props: PageProps<"/giao-vien/cau-hoi/[id]">) {
  const actor = await requirePageActor(["TEACHER", "ADMIN"]);
  const { id } = await props.params;
  let dto;
  try {
    dto = await getQuestionForEditor(actor, id);
  } catch (err) {
    if (isAppError(err) && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }
  const subjects = await adminListSubjects(actor);
  return (
    <>
      <PageHeader title="Sửa câu hỏi" />
      <QuestionEditor key={`${dto.id}-${dto.revision}`} subjects={subjects} initial={dto} cloudinaryEnabled={isCloudinaryConfigured()} />
    </>
  );
}
