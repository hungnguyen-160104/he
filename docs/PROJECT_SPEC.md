# Đặc tả dự án — ExamHub THPT

Đặc tả gốc, có hiệu lực cao nhất: [`EXAMHUB_THPT_CLAUDE_CODE_MASTER_PROMPT.md`](../EXAMHUB_THPT_CLAUDE_CODE_MASTER_PROMPT.md). Tài liệu này tóm tắt và ghi lại các **quyết định triển khai cụ thể** khi đặc tả để mở.

## Phạm vi MVP (đã khóa)
- Web responsive tiếng Việt, mobile-first, light mode, xanh/trắng/xám.
- Vai trò: `STUDENT` (tự đăng ký), `TEACHER` (admin tạo), `ADMIN` (bootstrap bằng script).
- 3 dạng câu: `SINGLE_CHOICE` (A–D), `TRUE_FALSE` (4 ý a–d), `SHORT_ANSWER` (số/chuỗi chuẩn hóa).
- Luyện tập theo chủ đề (không xếp hạng) và thi thử đếm giờ (server là nguồn thời gian).
- Bảng xếp hạng theo môn × tuần/tháng/năm, dựa trên bộ đề của campaign, chỉ tính **lượt đầu tiên**, phải hoàn thành đủ bộ đề.
- Giáo viên soạn câu hỏi/đề → admin duyệt/xuất bản. Nội dung đã xuất bản bất biến (version mới khi sửa).
- Dữ liệu DEMO đánh dấu `isDemo`, xóa được an toàn. Không nạp đề thật.

## Ngoài phạm vi
Thanh toán, AI, OCR/import PDF/Word, mạng xã hội, native app, proctoring, multi-tenant, lớp học, microservices, Redis/queue, realtime, chấm tự luận Ngữ văn.

## Quyết định triển khai khi đặc tả để ngỏ
| Chủ đề | Quyết định |
|---|---|
| Username | 3–30 ký tự `a-z 0-9 _ .`, bắt đầu/kết thúc bằng chữ/số, không `..`; so sánh không phân biệt hoa thường. |
| Mật khẩu | 10–128 ký tự, ≥2 nhóm ký tự, chặn danh sách mật khẩu phổ biến, không chứa username/phần đầu email. Thông báo lỗi chung chung. |
| Session | NextAuth v4 JWT cookie; DB re-check role/status/`sessionVersion` ở thao tác nhạy cảm (Phase 2). |
| Tie-break xếp hạng | `averageScaled DESC`, `completedAt ASC` (thời điểm hoàn thành đề cuối cùng của bộ), `userId ASC`. |
| Làm tròn điểm | Decimal.js, half-up, 1 điểm làm tròn duy nhất khi quy về thang 10 → integer 0..10000. Hiển thị 2 chữ số thập phân. |
| Leaderboard opt-out | Người opt-out vẫn được tính hạng nội bộ (họ thấy hạng của mình), nhưng công khai hiển thị “Học sinh ẩn danh”. |
| Lượt làm dở khi campaign đóng | Phải nộp/hết giờ trước `periodEndAt` mới được tính; sau đó vẫn lưu cho học tập. |
| Email | Adapter `none`/`console`(dev)/`resend`. Không có provider → chức năng quên mật khẩu/xác minh hiển thị thông báo thay vì giả gửi. |
| Đảo thứ tự phương án | MVP giữ nguyên thứ tự (giảm rủi ro), ID phương án ổn định. |
