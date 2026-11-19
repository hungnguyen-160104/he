import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExamTaker } from "@/components/attempt/exam-taker";
import { requirePageActor } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import { getAttemptForTaking } from "@/modules/attempts/service";

export const metadata: Metadata = { title: "Làm bài" };
export const dynamic = "force-dynamic";

export default async function TakeAttemptPage(props: PageProps<"/lam-bai/[attemptId]">) {
  const actor = await requirePageActor();
  const { attemptId } = await props.params;
  let data;
  try {
    data = await getAttemptForTaking(actor, attemptId);
  } catch (err) {
    if (isAppError(err) && err.status === 404) notFound();
    throw err;
  }
  // Expired/submitted attempts are finalized server-side → show the result instead.
  if (data.status !== "IN_PROGRESS") redirect(`/ket-qua/${attemptId}`);
  return <ExamTaker initial={data} />;
}
