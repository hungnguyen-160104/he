# Bảo mật

| Hạng mục | Cơ chế | Trạng thái |
|---|---|---|
| Header bảo mật | CSP (ADR-004), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (prod), tắt `X-Powered-By` | ✅ Phase 1 (E2E kiểm tra) |
| CSRF | Origin/Sec-Fetch-Site check + bắt buộc JSON cho mutation (ADR-005); NextAuth CSRF token | ✅ Phase 1 (unit test) |
| Validate input | Zod `.strict()` (chống mass assignment), giới hạn body 64 KB, `assertNoMongoOperators` chống NoSQL injection | ✅ Phase 1 (unit test) |
| Lỗi | `toAppError` map mọi lỗi về mã an toàn, 500 không lộ thông điệp/stack | ✅ Phase 1 |
| Log | `logger.redact` che khóa nhạy cảm (password/token/hash/answer/key/uri…) và thông tin đăng nhập trong URL | ✅ Phase 1 |
| Open redirect | `safeRedirectPath` chỉ chấp nhận đường dẫn tương đối cùng site | ✅ Phase 1 |
| Env | Zod validate, fail-fast production, không in giá trị secret | ✅ Phase 1 |
| Mật khẩu | Argon2id (`@node-rs/argon2`, m=19456 KiB, t=2, p=1 — khuyến nghị OWASP), `select:false`, verify giả khi user không tồn tại (cân bằng thời gian) | ✅ Phase 2 |
| Session | JWT cookie HttpOnly/SameSite=Lax/Secure (HTTPS); mỗi request bảo vệ đọc lại role/status/sessionVersion từ DB → khóa, đổi vai trò, đổi mật khẩu có hiệu lực ngay | ✅ Phase 2 (E2E) |
| Rate limit | Bộ đếm nguyên tử MongoDB + TTL, khóa băm SHA-256 (login 30/15ph/IP + 10/15ph/identifier, register 10/giờ/IP, reset, đổi mật khẩu, admin) | ✅ Phase 2 (upload/submit: Phase 3/5) |
| RBAC + ownership | Kiểm tra tại service (`assertRole`), layout chỉ là UX; `proxy.ts` chỉ redirect lạc quan | ✅ Phase 2 (người dùng) |
| Đáp án | `question_keys` tách collection; DTO học sinh dựng từ allow-list; chính sách công bố (ẩn trong kỳ xếp hạng đang diễn ra); test JSON không chứa key/explanation | ✅ Phase 3–5 (integration + E2E) |
| Upload | Cloudinary signed (folder/định dạng/timestamp do server ký), kiểm tra phía client + verify qua Admin API (folder, định dạng, ≤3 MB, xóa asset sai), media ref chỉ chấp nhận đúng cloud/folder | ✅ Phase 3 (integration; upload thật **NOT VERIFIED — missing configuration**) |

| Toàn vẹn bài thi | thời gian theo `expiresAt` của server; autosave optimistic revision (409); submit chốt đúng 1 lần; first attempt nguyên tử; điểm do server tính bằng Decimal | ✅ Phase 5 |
| Xếp hạng | chỉ lượt đầu của STUDENT ACTIVE, đủ bộ đề, nộp trước khi kỳ kết thúc; snapshot bất biến; kiểm tra công bằng khi kích hoạt | ✅ Phase 6 |
| Rich text | không render HTML người dùng; KaTeX `trust:false` | ✅ Phase 3 (unit test XSS) |
| Cache | chỉ cache catalog công khai (môn/đề metadata, ≤120 s); thay đổi của admin hết hạn ngay (`revalidateTag(tag, { expire: 0 })`); dữ liệu cá nhân/bài làm/đáp án không cache (`private, no-store`) | ✅ |

> **Lưu ý `x-forwarded-for`:** rate limit theo IP dựa vào header này (Vercel ghi đè giá trị từ client). Nếu deploy sau proxy khác, cấu hình proxy ghi đè header để tránh giả mạo IP. `RATE_LIMIT_MULTIPLIER` chỉ dành cho môi trường test (E2E dùng 20 vì mọi trình duyệt chung một IP).

## Quy tắc tài khoản
Xem `docs/PROJECT_SPEC.md` (username/mật khẩu). Đăng nhập trả lỗi chung chung “Tên đăng nhập/email hoặc mật khẩu không đúng”, không tiết lộ tài khoản tồn tại. Thông báo “tài khoản bị khóa” chỉ hiện **sau khi** mật khẩu đúng.

## Phiên & mật khẩu tạm
- Tài khoản giáo viên do admin tạo và mật khẩu do admin cấp lại đều là **mật khẩu tạm** (`mustChangePassword`): mọi trang/API (trừ Hồ sơ, đổi mật khẩu) bị chặn cho đến khi đổi.
- Xác minh email chỉ áp dụng cho học sinh tự đăng ký; tài khoản do admin tạo không bị đánh dấu “đã xác minh”.
- Khi bật xác minh email, đăng ký với email đã tồn tại trả về cùng phản hồi như thành công (chống dò email). Khi tắt (dev/DEMO) báo trùng email để dễ dùng.

## Quyền riêng tư (người dùng có thể chưa thành niên)
- Thu thập tối thiểu: username, email, biệt danh, lớp (tùy chọn).
- Bảng xếp hạng chỉ hiện biệt danh; có quyền ẩn; không bao giờ hiện email.
- **Chưa đánh giá pháp lý** tuân thủ Nghị định 13/2023/NĐ-CP / Luật Bảo vệ dữ liệu cá nhân. Cần rà soát trước khi mở công khai.

## Checklist trước production
- [ ] `AUTH_SECRET` ngẫu nhiên ≥ 32 ký tự, chỉ đặt trong Vercel env.
- [ ] DB user Atlas quyền tối thiểu (readWrite trên 1 database), mật khẩu mạnh.
- [ ] Network Access Atlas: nếu buộc mở `0.0.0.0/0` (Vercel Hobby không có IP cố định) thì chấp nhận rủi ro có ý thức, dựa vào TLS + mật khẩu mạnh + giám sát.
- [ ] `REQUIRE_EMAIL_VERIFICATION=true` và mail provider đã xác minh domain, hoặc đóng đăng ký công khai.
- [ ] `pnpm audit` không có lỗ hổng nghiêm trọng chưa xử lý.
