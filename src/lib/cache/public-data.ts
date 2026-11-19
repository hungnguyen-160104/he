import "server-only";
import { unstable_cache } from "next/cache";
import { isDatabaseConfigured } from "@/lib/env";
import { getSubjectBySlug, listActiveSubjects, listTopics } from "@/modules/subjects/service";

/**
 * Short-lived cache for PUBLIC catalog data only (subjects/topics/published exams).
 * Personal data, attempts, answers and live rankings are never cached here.
 * Invalidated with revalidateTag("subjects"|"exams", "max") on admin changes.
 */
export const getPublicSubjects = unstable_cache(async () => listActiveSubjects(), ["public-subjects"], { revalidate: 120, tags: ["subjects"] });

export const getPublicSubjectBySlug = unstable_cache(async (slug: string) => getSubjectBySlug(slug), ["public-subject-by-slug"], {
  revalidate: 120,
  tags: ["subjects"],
});

export const getPublicTopics = unstable_cache(async (subjectId: string) => listTopics(subjectId), ["public-topics"], { revalidate: 120, tags: ["subjects"] });

/** Returns null when the DB is not configured or unreachable (UI shows a friendly state). */
export async function safePublic<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await fn();
  } catch {
    return null;
  }
}
