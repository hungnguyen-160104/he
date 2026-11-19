import "server-only";
import { unstable_cache } from "next/cache";
import { countPublishedExamsBySubject, getPublishedExamDetail, listPublishedExams } from "@/modules/exams/service";
import type { PublicExamQuery } from "@/modules/exams/validation";

/** Published exam catalog (metadata only). Invalidated with revalidateTag("exams", "max"). */
export const getPublicExamCountsBySubject = unstable_cache(async () => countPublishedExamsBySubject(), ["public-exam-counts"], {
  revalidate: 60,
  tags: ["exams"],
});

export const getPublicExamList = unstable_cache(async (q: PublicExamQuery) => listPublishedExams(q), ["public-exam-list"], { revalidate: 60, tags: ["exams"] });

export const getPublicExamDetail = unstable_cache(async (id: string) => getPublishedExamDetail(id), ["public-exam-detail"], { revalidate: 60, tags: ["exams"] });
