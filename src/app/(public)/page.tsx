import Link from "next/link";
import { BookOpenCheck, Clock3, RefreshCcw, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeSubjects, HomeLatestExams } from "./home-sections";

const REASONS = [
  { icon: BookOpenCheck, title: "Ôn theo chủ đề", text: "Chọn môn, chủ đề và độ khó để luyện đúng phần còn yếu." },
  { icon: Clock3, title: "Thi thử có đếm giờ", text: "Làm đề như thi thật, thời gian do máy chủ tính chính xác." },
  { icon: RefreshCcw, title: "Làm lại không giới hạn", text: "Xem lại lịch sử, làm lại đề để tiến bộ từng ngày." },
  { icon: Trophy, title: "Bảng xếp hạng công bằng", text: "Xếp hạng theo môn từng tuần/tháng/năm, chỉ tính lượt làm đầu tiên." },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-card">
        <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 px-4 py-12 sm:py-16 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" /> Dành cho học sinh lớp 10–12
            </p>
            <h1 className="text-3xl leading-tight sm:text-4xl">Luyện thi THPT hiệu quả</h1>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              Ôn tập theo chủ đề, thi thử có đếm giờ với ba dạng câu hỏi trắc nghiệm của kỳ thi tốt nghiệp THPT và theo dõi tiến bộ của bạn.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/luyen-tap">Bắt đầu luyện tập</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/de-thi">Xem đề thi thử</Link>
              </Button>
            </div>
          </div>
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle className="text-base">Ba dạng câu hỏi được hỗ trợ</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="font-medium">Trắc nghiệm nhiều lựa chọn</p>
                <p className="text-muted-foreground">Chọn một đáp án đúng trong A, B, C, D.</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="font-medium">Trắc nghiệm đúng/sai</p>
                <p className="text-muted-foreground">Mỗi câu có 4 ý a, b, c, d — chọn Đúng hoặc Sai cho từng ý.</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="font-medium">Trả lời ngắn</p>
                <p className="text-muted-foreground">Điền kết quả là số hoặc cụm từ ngắn.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl sm:text-2xl">Chọn môn học</h2>
          <Link href="/mon-hoc" className="text-sm font-medium text-primary hover:underline">
            Tất cả môn
          </Link>
        </div>
        <HomeSubjects />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl sm:text-2xl">Đề thi mới</h2>
          <Link href="/de-thi" className="text-sm font-medium text-primary hover:underline">
            Xem tất cả
          </Link>
        </div>
        <HomeLatestExams />
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-6 text-xl sm:text-2xl">Vì sao chọn ExamHub THPT?</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-lg border bg-background p-4">
                <Icon className="mb-2 size-6 text-primary" aria-hidden="true" />
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
