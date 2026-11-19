# Tiến độ — ExamHub THPT

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 1 | Foundation & UI base | **DONE** |
| 2 | Authentication, Users & RBAC | **DONE** |
| 3 | Subjects, Topics, Question Bank & Cloudinary | **DONE** (upload Cloudinary thật: NOT VERIFIED — missing configuration) |
| 4 | Exam Builder & Review Workflow | **DONE** |
| 5 | Practice, Mock Attempts & Grading | **DONE** |
| 6 | Rankings, Statistics & Admin Campaigns | **DONE** |
| 7 | Hardening, E2E & Deployment Docs | **DONE** (deploy thật lên Vercel/Atlas: NOT VERIFIED — missing configuration) |

Cập nhật: 2026-11-19. Quy mô: ~14.2k dòng TypeScript trong `src/`, 60 Route Handlers.

## Kết quả kiểm tra cuối (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS — 0 lỗi, 0 cảnh báo |
| `pnpm test` | PASS — 11 files, **154 tests** (unit + integration trên MongoDB in-memory replica set, gồm chạy thật `pnpm seed:demo`) |
| `pnpm build` | PASS |
| `pnpm test:e2e` | PASS — **25/25** (Chromium, production build + MongoDB in-memory, bootstrap admin + seed DEMO thật) |
| `pnpm audit --prod` | No known vulnerabilities |

## Bảng nghiệm thu (đặc tả §13, §17)
| # | Tình huống | Kiểm chứng | Kết quả |
|---|---|---|---|
| 17.1 | Bấm "Bắt đầu" 2 lần gần như cùng lúc → 1 lượt đầu | integration (6 request song song, cùng/khác idempotency key) | PASS |
| 17.2 | Hai tab → không ghi đè âm thầm | integration (409 REVISION_CONFLICT) + UI hộp thoại tải lại | PASS |
| 17.3 | Quay lại sau 5 phút → thời gian còn lại theo `expiresAt` server | integration (25 phút còn lại) + E2E reload/resume | PASS |
| 17.4 | Quay lại sau khi hết giờ → chốt câu đã lưu, không sửa được | integration (ATTEMPT_EXPIRED, điểm từ câu đã lưu) | PASS |
| 17.5 | Nộp 2 lần → 1 kết quả | integration (2 submit đồng thời) | PASS |
| 17.6 | Sửa câu đã dùng trong đề → bài cũ đúng phiên bản | integration (version mới, kết quả cũ không đổi) | PASS |
| 17.7 | Student gọi API admin → 403 | integration + E2E | PASS |
| 17.8 | Lấy đáp án từ payload khi thi → không thể | integration + E2E (quét JSON) | PASS |
| 17.9 | Upload svg/html/>3MB → bị từ chối | client check + server verify (định dạng/kích thước/folder) + test cấu trúc media | PASS (logic) · upload thật NOT VERIFIED |
| 17.10 | Kỳ 3 đề, mới làm 2 → chưa có hạng | unit + integration + E2E (1/2) | PASS |
| 17.11 | Lần đầu 6 điểm, làm lại 10 → vẫn tính lần đầu | integration (0→10 rồi làm lại) + unit | PASS |
| 17.12 | Kỳ đóng: nộp muộn không tính | integration (bắt đầu trong kỳ, nộp sau kỳ) | PASS |
| 17.13 | Ranh giới kỳ theo Asia/Ho_Chi_Minh | unit (tuần/tháng/năm qua ngày UTC) | PASS |
| 17.14 | Thiếu Cloudinary → câu không ảnh vẫn thêm được; upload báo lỗi cấu hình | integration (503) + UI thông báo | PASS |
| 17.15 | Thiếu email provider → không giả gửi | integration (503, đăng ký đóng khi bắt buộc xác minh) | PASS |
| 17.16 | MongoDB lỗi → lỗi dễ hiểu, không lộ secret | unit (error mapping, redact URI) | PASS |
| 17.17 | Ẩn biệt danh → không hiện định danh công khai | integration ("Học sinh ẩn danh") + E2E hồ sơ | PASS |
| 17.18 | Chưa có đề thật → UI vẫn hữu dụng | empty states + hướng dẫn seed DEMO | PASS |
| 13.3.1 | Seed + bootstrap → đăng ký → login username → logout → login email | E2E | PASS |
| 13.3.2 | Admin tạo GV → GV tạo 3 dạng → đề → admin từ chối có lý do → GV sửa → admin duyệt | E2E | PASS |
| 13.3.3 | Thi thử → lưu → refresh/resume → nộp → điểm + lời giải theo chính sách | E2E | PASS |
| 13.3.4 | Làm lại → lịch sử có cả 2 lượt; xếp hạng giữ lượt đầu | E2E + integration | PASS |
| 13.3.5 | Kỳ tuần 2 đề: hoàn thành đủ có hạng, thiếu không có; chốt + snapshot bất biến | E2E (live) + integration (chốt/snapshot) | PASS |
| 13.3.6 | Responsive 360/768/1440, không tràn ngang | E2E (trang công khai, màn làm bài, dashboard, lịch sử, luyện tập, BXH, hồ sơ) | PASS |
| — | Kết nối MongoDB Atlas thật, deploy Vercel, Cloudinary thật, email Resend thật | — | **NOT VERIFIED — missing configuration** |

## Lỗi phát hiện & đã sửa trong Phase 3–7
- Grid ngầm định co theo min-content làm tràn ngang ở 360px (dashboard) → mọi `grid` có `grid-cols-1`.
- Cache catalog bị phục vụ bản cũ sau khi duyệt/gỡ đề (`revalidateTag "max"`) → `{ expire: 0 }` (ADR-008).
- Harness E2E dùng `spawnSync` làm treo mongod in-memory → spawn bất đồng bộ.
- Rate limit đăng ký chặn bộ E2E (cùng IP) → `RATE_LIMIT_MULTIPLIER` cho môi trường test.
- Lint React Compiler: đọc/ghi ref trong render, `Date.now()` trong render, setState đồng bộ trong effect → tái cấu trúc màn làm bài, trình soạn đề, quản lý chủ đề.
- Trùng phương án trong câu DEMO (đạo hàm/log) → sửa bộ sinh câu.
- Xem trước đáp án hiển thị "undefined" khi chưa chọn → "chưa chọn".

## Rủi ro / giới hạn còn lại (ghi trung thực)
- Chưa chạy với **MongoDB Atlas, Vercel, Cloudinary, Resend thật** (không có credentials) — toàn bộ kiểm thử dùng MongoDB in-memory.
- Bảo vệ "admin cuối cùng" dùng cập nhật-rồi-kiểm-tra; hai admin hạ quyền nhau đúng cùng lúc là trường hợp biên chấp nhận cho MVP.
- Rate limit theo IP tin `x-forwarded-for` (an toàn trên Vercel; cần cấu hình nếu sau proxy khác).
- Bảng xếp hạng đang diễn ra tính on-demand mỗi request (đủ cho quy mô nhỏ; nếu lớn hãy thêm cache ngắn theo campaign).
- Nội dung câu hỏi DEMO là giả lập; chưa đối chiếu cấu trúc đề chính thức năm hiện hành — quy tắc tính điểm là cấu hình DEMO.
- Chưa đánh giá pháp lý về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).

## Đề xuất v1.1 (ngoài MVP)
Import câu hỏi hàng loạt từ CSV/Excel có kiểm tra; đảo thứ tự phương án nhất quán; thống kê câu hỏi (tỉ lệ đúng, độ phân hóa) cho giáo viên; cache ngắn bảng xếp hạng theo campaign; xuất kết quả kỳ ra CSV; trang quản lý quota Cloudinary/Atlas; regrade có phê duyệt khi đổi đáp án; email thật (Resend) + xác minh email bắt buộc ở production; PWA/offline nhẹ cho màn làm bài.

## Cập nhật 2026-11-19 (sau Phase 7) — dữ liệu mock theo cấu trúc 2025
- `pnpm seed:demo` (mặc định) tạo 3 đề đầy đủ kèm lời giải: Toán 22 câu/90′, Vật lí 28 câu/50′, Hóa học 28 câu/50′; quy tắc tính điểm theo môn (phần III: Toán 0,5; Lý/Hóa 0,25) → mỗi đề đúng 10 điểm. Hồ sơ cũ chuyển thành `--profile e2e`.
- `tests/unit/demo-content.test.ts`: kiểm tra cấu trúc 3 phần, schema, LaTeX không lỗi, đáp án ngắn ≤ 4 ký tự, bài làm đúng hết = 10,00, đáp án trải đều A–D.
- `pnpm db:local`: MongoDB cục bộ lưu bền (replica set) dùng binary đã cache; `.env.local` đã trỏ vào đây.
- `bootstrap:admin --allow-weak-password` (chỉ local, không production) → đã tạo **admin / admin123**.
- Kết quả: `pnpm test` 163/163 PASS, `pnpm lint` PASS, `pnpm build` PASS, `pnpm test:e2e` 25/25 PASS; kiểm tra thủ công trên dev server: đăng nhập admin OK, làm đề Toán đúng hết → 10,00, trang kết quả hiển thị lời giải.

## Cập nhật 2026-11-19 — tối ưu giao diện mobile
Kiểm tra thủ công bằng Playwright ở 375px (iPhone, cảm ứng) trên toàn bộ trang công khai / học sinh / giáo viên / quản trị, rồi sửa:
- **Màn làm bài:** thanh dưới cố định gồm ‹ Câu trước · Nộp bài · Câu sau › (trước đây phải cuộn xuống cuối câu mới chuyển câu); danh sách câu tự đóng sau khi chọn; tự cuộn lên đầu câu mới; ẩn thanh tab "Góc học tập" khi đang làm bài; nút Đúng/Sai chia đôi, cao 44px; nhãn rút gọn ("Đánh dấu", "Không giới hạn", "Chưa lưu"); chừa vùng an toàn iPhone (`viewport-fit=cover` + `env(safe-area-inset-*)`).
- **Bảng:** bỏ `whitespace-nowrap` mặc định của `TableCell` → cột trạng thái/điểm/thao tác không còn bị đẩy ra ngoài màn hình (lịch sử, ngân hàng câu hỏi, người dùng…); bảng người dùng gộp vai trò vào dưới tên trên mobile.
- **Form/điều khiển:** ô nhập/select ≥ 16px trên thiết bị cảm ứng (iOS không tự phóng to); `Button`/`Input`/`Select`/`Tabs` cao hơn khi `pointer: coarse`; bộ lọc (đề thi, lịch sử, câu hỏi, người dùng) xếp lưới 2 cột; lọc trạng thái đề của giáo viên thành chip cuộn ngang.
- **Khung:** thanh tab khu vực ẩn thanh cuộn, mờ dần ở mép phải, tự cuộn tới tab đang mở; `Card` đệm nhỏ hơn trên mobile, bỏ `pt-6` trùng lặp (khoảng trắng thừa ở thẻ thống kê); 3 ô thống kê ở chi tiết đề thành một hàng.
- E2E 360px bổ sung: chọn câu đóng danh sách, Câu sau/Câu trước ở thanh dưới, ẩn tab khu vực.
- Kết quả: `pnpm typecheck` PASS, `pnpm lint` PASS, `pnpm build` PASS, `pnpm test:e2e` **25/25 PASS**. `pnpm test` 189/190 — 1 lỗi ở `tests/integration/seed-demo.test.ts` do nội dung DEMO các môn mới (`scripts/demo-content/*`, đang được soạn song song, không thuộc thay đổi này): slug chủ đề Lịch sử dài 89 ký tự > giới hạn 60.

## Cập nhật 2026-11-19 — mock đủ 11 môn theo cấu trúc đề 2025
- `pnpm seed:demo` giờ tạo **11 đề / 314 câu**, mỗi môn trắc nghiệm 1 đề, mọi câu có lời giải; làm đúng hết = 10,00 ở mọi đề:
  - Toán 12/4/6 (90′, phần III 0,5đ); Vật lí, Hóa học, Sinh học, Địa lí 18/4/6 (50′, phần III 0,25đ);
  - Lịch sử, GDKT&PL, Tin học, Công nghệ Công nghiệp, Công nghệ Nông nghiệp 24/4 (50′); Tiếng Anh 40 câu (50′, đúng các dạng bài 2025: quảng cáo/thông báo, tờ rơi, sắp xếp câu, điền câu vào đoạn, 2 bài đọc).
  - Ngữ văn (tự luận) không có — ngoài phạm vi MVP theo đặc tả.
- Mã: `scripts/demo-content/` — `builders.ts` (mc/tf/sa, `topicSlug`), `structure.ts` (số câu/thời gian theo môn), một file mỗi môn, `index.ts` (`DEMO_EXAMS`), `check.ts` (kiểm tra nhanh một file: `node --conditions=react-server --import tsx scripts/demo-content/check.ts <file>`).
- Lỗi phát hiện & sửa: tên chủ đề dài làm slug > 60 ký tự → seed lỗi; đã rút gọn và thêm kiểm tra độ dài slug vào unit test + `check.ts`.
- DB đã seed bằng bản cũ (3 đề) phải `pnpm seed:demo --remove` rồi `pnpm seed:demo` (seed bỏ qua nếu đã có câu DEMO; quy tắc tính điểm cũ của Sinh/Địa có phần III = 0,5đ).
- Kết quả chạy thật: `pnpm typecheck` PASS · `pnpm lint` PASS · `pnpm test` 12 files **190/190** PASS (gồm seed thật 314 câu/11 đề) · `pnpm build` PASS · `pnpm test:e2e` **25/25** PASS.
- Giới hạn: nội dung là câu hỏi tự biên soạn mô phỏng cấu trúc đề 2025, chưa được giáo viên bộ môn thẩm định; số liệu trong đề Địa lí/Công nghệ ghi rõ "giả định, mang tính minh họa".

## NEXT ACTION
1. Người dùng điền `MONGODB_URI` (Atlas) vào `.env.local` → `pnpm bootstrap:admin` → `pnpm dev` → kiểm tra `/api/health` (`database: "ok"`).
2. (Tùy chọn) `pnpm seed:demo` để trải nghiệm 11 đề DEMO (DB đã seed bản cũ: chạy `--remove` trước); khi có đề thật: `pnpm seed:demo --remove`.
3. Cloudinary + Vercel theo `docs/DEPLOYMENT.md`, rồi chạy checklist smoke test production.
