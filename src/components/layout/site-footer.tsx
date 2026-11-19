import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ExamHub THPT — Nền tảng luyện thi tốt nghiệp THPT.</p>
        <nav aria-label="Liên kết chân trang" className="flex flex-wrap gap-4">
          <Link href="/chinh-sach-rieng-tu" className="hover:text-foreground hover:underline">
            Chính sách quyền riêng tư
          </Link>
          <Link href="/dieu-khoan" className="hover:text-foreground hover:underline">
            Điều khoản sử dụng
          </Link>
        </nav>
      </div>
    </footer>
  );
}
