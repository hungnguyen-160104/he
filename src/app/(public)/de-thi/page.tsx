import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfigMissingNotice, EmptyState, PageHeader } from "@/components/common/states";
import { ExamGrid } from "@/components/exams/exam-card";
import { PaginationLinks, firstString } from "@/components/common/pagination-links";
import { getPublicSubjects, safePublic } from "@/lib/cache/public-data";
import { getPublicExamList } from "@/lib/cache/public-exams";
import { isDatabaseConfigured } from "@/lib/env";
import { publicExamQuerySchema } from "@/modules/exams/validation";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/modules/questions/types";

export const metadata: Metadata = { title: "Đề thi" };
export const dynamic = "force-dynamic";

const selectClass = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:h-9";

export default async function ExamsPage(props: PageProps<"/de-thi">) {
  const sp = await props.searchParams;
  const raw = { page: firstString(sp.page), subjectId: firstString(sp.subjectId), mode: firstString(sp.mode), difficulty: firstString(sp.difficulty), year: firstString(sp.year), q: firstString(sp.q) };
  const parsed = publicExamQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : publicExamQuerySchema.parse({});
  const [subjects, list] = await Promise.all([safePublic(() => getPublicSubjects()), safePublic(() => getPublicExamList(query))]);
  const totalPages = list ? Math.max(1, Math.ceil(list.total / query.limit)) : 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader title="Đề thi" description="Đề thi thử và đề luyện tập đã được quản trị viên duyệt." />
      {!isDatabaseConfigured() ? (
        <ConfigMissingNotice what="cơ sở dữ liệu" />
      ) : (
        <>
          <form method="get" className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]" role="search" aria-label="Lọc đề thi">
            <Input name="q" defaultValue={query.q ?? ""} placeholder="Tìm theo tên đề…" aria-label="Tìm theo tên đề" className="col-span-2 lg:col-span-1" />
            <select name="subjectId" defaultValue={query.subjectId ?? ""} aria-label="Môn học" className={selectClass}>
              <option value="">Tất cả môn</option>
              {(subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select name="mode" defaultValue={query.mode ?? ""} aria-label="Hình thức" className={selectClass}>
              <option value="">Mọi hình thức</option>
              <option value="MOCK">Thi thử</option>
              <option value="PRACTICE">Luyện tập</option>
            </select>
            <select name="difficulty" defaultValue={query.difficulty ?? ""} aria-label="Độ khó" className={selectClass}>
              <option value="">Mọi độ khó</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
            <Input name="year" type="number" min={2020} max={2100} defaultValue={query.year ?? ""} placeholder="Năm" aria-label="Năm" className="lg:w-24" />
            <Button type="submit" className="col-span-2 lg:col-span-1"><Search className="size-4" aria-hidden="true" /> Lọc</Button>
          </form>
          {!list ? (
            <EmptyState title="Không tải được danh sách đề" description="Vui lòng thử lại sau." />
          ) : list.items.length === 0 ? (
            <EmptyState title="Chưa có đề thi phù hợp" description="Hãy thử bỏ bớt bộ lọc. Nếu hệ thống chưa có đề, quản trị viên có thể chạy pnpm seed:demo để tạo đề DEMO." />
          ) : (
            <ExamGrid exams={list.items} />
          )}
          <PaginationLinks basePath="/de-thi" page={query.page} totalPages={totalPages} params={{ ...raw, page: undefined }} />
        </>
      )}
    </div>
  );
}
