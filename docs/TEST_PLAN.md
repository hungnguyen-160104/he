# Kế hoạch kiểm thử

## Công cụ
- **Unit** (`tests/unit`, Vitest): logic thuần — validators, grading, ranking, formatting, security helpers.
- **Integration** (`tests/integration`, Vitest + `mongodb-memory-server` replica set): service + Mongo thật trong bộ nhớ (transactions, unique index, race conditions). Không cần Docker/Atlas. Binary mongod 8.2.x được cache tại `~/.cache/mongodb-binaries`.
- **E2E** (`tests/e2e`, Playwright Chromium): `scripts/e2e-server.ts` chạy production build + MongoDB in-memory (`examhub_e2e`). Lệnh: `pnpm build && pnpm test:e2e`.
- Không bao giờ chạy test vào database production.

## Ma trận (cập nhật theo phase)
| Khu vực | Loại | Phase | Trạng thái |
|---|---|---|---|
| Env validation, error mapping, readJson (size/JSON/operator/mass-assignment), origin/CSRF, open redirect, ObjectId, pagination, redaction, formatting | Unit | 1 | ✅ PASS |
| Username/email normalization, password strength, register/login schema, cross-field errors | Unit | 1 | ✅ PASS |
| Responsive 360/768/1440 không tràn ngang (9 trang công khai), menu mobile, form lỗi tiếng Việt, security headers, health, 404 | E2E | 1 | ✅ PASS |
| Đăng ký, trùng username/email (kể cả hoa/thường, đăng ký đồng thời), sai mật khẩu, tài khoản khóa (thu hồi phiên ngay), leo thang quyền/mass assignment, admin tạo GV + đổi mật khẩu tạm, đăng nhập bằng username và email, rate limit, token một lần/hết hạn, admin cuối cùng, cross-origin | Integration (23) + E2E (10) | 2 | ✅ PASS |
| DTO không lộ đáp án (kể cả nested), version bất biến, sửa nháp tại chỗ, conflict revision, chủ sở hữu, short-answer (1,5 / 1.5 / 15, dung sai Decimal), XSS KaTeX, chữ ký Cloudinary không lộ secret, media ngoài hệ thống bị từ chối, thiếu cấu hình Cloudinary → 503 | Unit + Integration | 3 | ✅ PASS |
| Chỉ câu đã duyệt, đề rỗng bị chặn, giáo viên không duyệt được, đề đã xuất bản bất biến, nhân bản, public chỉ metadata, gỡ xuất bản | Integration + E2E | 4 | ✅ PASS |
| Grading 3 dạng (0–4 ý đúng, bỏ trống, half-up, 0.1 + 0.2), 6 start đồng thời → 1 first, cùng idempotency key → 1 lượt, submit đồng thời → 1 kết quả, autosave 409/400/422, hết giờ chốt từ câu đã lưu, resume đúng thời gian còn lại, retake, GV/admin không rank, sửa câu không đổi bài cũ, practice báo số câu thật, payload không lộ đáp án | Unit + Integration + E2E | 5 | ✅ PASS |
| Ranking: 1/3, 3/3 average, retake không đổi, first = 0 giữ nguyên, timezone tuần/tháng/năm, tie-break ổn định, tách môn, GV/admin loại, ẩn danh, nộp sau kỳ không tính, đáp án ẩn trong kỳ, chốt trước hạn bị chặn, snapshot bất biến, chặn kích hoạt khi đề đã bị làm trước kỳ | Unit + Integration + E2E | 6 | ✅ PASS |
| E2E 6 hành trình (đặc tả §13.3): seed + bootstrap; đăng ký/đăng nhập 2 cách; admin tạo GV → GV tạo 3 dạng → đề → từ chối có lý do → sửa → duyệt; thi thử + refresh/resume + nộp + lời giải; làm lại + lịch sử; kỳ tuần 2/2 có hạng, 1/2 hiện tiến độ; responsive 360/768/1440 | E2E | 7 | xem PROGRESS |
| `pnpm seed:demo` tạo / idempotent / `--remove` chỉ xóa DEMO | Integration (child process) | 7 | ✅ PASS |
