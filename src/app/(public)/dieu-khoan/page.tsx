import type { Metadata } from "next";

export const metadata: Metadata = { title: "Điều khoản sử dụng" };

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl sm:text-3xl">Điều khoản sử dụng</h1>
      <p className="mt-2 text-sm text-muted-foreground">Áp dụng cho giai đoạn thử nghiệm của ExamHub THPT.</p>
      <div className="mt-6 space-y-6 leading-relaxed">
        <section>
          <h2 className="text-lg">1. Mục đích</h2>
          <p className="mt-2">
            ExamHub THPT là công cụ hỗ trợ ôn luyện. Các đề thi và câu hỏi trên hệ thống do giáo viên biên soạn hoặc là dữ liệu DEMO; chúng
            không phải đề thi chính thức của Bộ Giáo dục và Đào tạo và không đảm bảo giống cấu trúc đề thi thật.
          </p>
        </section>
        <section>
          <h2 className="text-lg">2. Tài khoản</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Bạn chịu trách nhiệm giữ bí mật mật khẩu và không chia sẻ tài khoản.</li>
            <li>Tài khoản tự đăng ký là tài khoản học sinh. Tài khoản giáo viên do quản trị viên cấp.</li>
            <li>Quản trị viên có thể khóa tài khoản vi phạm điều khoản.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg">3. Làm bài và xếp hạng</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Điểm số do máy chủ chấm; thời gian làm bài tính theo đồng hồ máy chủ.</li>
            <li>Bảng xếp hạng chỉ tính lượt làm đầu tiên của mỗi đề trong kỳ; làm lại không thay đổi thứ hạng.</li>
            <li>Nghiêm cấm gian lận, khai thác lỗi hoặc can thiệp vào hệ thống để thay đổi kết quả.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg">4. Nội dung</h2>
          <p className="mt-2">Giáo viên cam kết nội dung tải lên không vi phạm bản quyền. Nội dung chỉ được xuất bản sau khi quản trị viên duyệt.</p>
        </section>
        <section>
          <h2 className="text-lg">5. Thay đổi</h2>
          <p className="mt-2">Điều khoản có thể được cập nhật; phiên bản mới có hiệu lực khi được đăng trên trang này.</p>
        </section>
      </div>
    </article>
  );
}
