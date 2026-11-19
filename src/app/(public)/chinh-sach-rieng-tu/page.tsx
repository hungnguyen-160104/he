import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chính sách quyền riêng tư" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl sm:text-3xl">Chính sách quyền riêng tư</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bản thông báo cơ bản cho giai đoạn thử nghiệm. Trước khi mở công khai, đơn vị vận hành cần rà soát theo quy định bảo vệ dữ liệu
        cá nhân hiện hành tại Việt Nam.
      </p>

      <div className="mt-6 space-y-6 leading-relaxed">
        <section>
          <h2 className="text-lg">1. Dữ liệu chúng tôi thu thập</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Thông tin tài khoản: tên đăng nhập, email, biệt danh, khối lớp (không bắt buộc).</li>
            <li>Mật khẩu chỉ được lưu dưới dạng băm một chiều (Argon2id); chúng tôi không thể đọc mật khẩu của bạn.</li>
            <li>Dữ liệu học tập: các lượt làm bài, câu trả lời, điểm số và thời gian làm bài.</li>
          </ul>
          <p className="mt-2">Chúng tôi hạn chế thu thập ở mức tối thiểu cần thiết vì người dùng có thể là người chưa thành niên.</p>
        </section>
        <section>
          <h2 className="text-lg">2. Mục đích sử dụng</h2>
          <p className="mt-2">Dữ liệu dùng để cung cấp chức năng luyện tập, chấm điểm, lưu lịch sử và bảng xếp hạng. Chúng tôi không bán dữ liệu và không dùng cho quảng cáo.</p>
        </section>
        <section>
          <h2 className="text-lg">3. Bảng xếp hạng công khai</h2>
          <p className="mt-2">
            Bảng xếp hạng chỉ hiển thị biệt danh và điểm trung bình. Email không bao giờ được hiển thị. Bạn có thể tắt hiển thị công khai
            trong trang Hồ sơ; khi tắt, tên của bạn sẽ được ẩn trên bảng xếp hạng công khai.
          </p>
        </section>
        <section>
          <h2 className="text-lg">4. Lưu trữ và bảo mật</h2>
          <p className="mt-2">
            Dữ liệu được lưu trên MongoDB Atlas; hình ảnh minh họa câu hỏi được lưu trên Cloudinary. Kết nối được mã hóa (HTTPS/TLS), phiên đăng
            nhập dùng cookie HttpOnly. Nhật ký hệ thống không ghi mật khẩu hay mã xác thực.
          </p>
        </section>
        <section>
          <h2 className="text-lg">5. Quyền của bạn</h2>
          <p className="mt-2">Bạn có thể xem và cập nhật thông tin hồ sơ, đổi mật khẩu, và yêu cầu quản trị viên xóa tài khoản cùng dữ liệu liên quan.</p>
        </section>
        <section>
          <h2 className="text-lg">6. Cookie</h2>
          <p className="mt-2">Chúng tôi chỉ dùng cookie cần thiết cho đăng nhập và bảo mật (chống giả mạo yêu cầu). Không dùng cookie quảng cáo hay theo dõi bên thứ ba.</p>
        </section>
      </div>
    </article>
  );
}
