# MASTER PROMPT CHO CLAUDE CODE — EXAMHUB THPT

> **MỤC ĐÍCH:** Sao chép toàn bộ văn bản này vào Claude Code trong một thư mục dự án mới, hoặc lưu thành `MASTER_PROMPT.md` trong thư mục dự án rồi yêu cầu Claude Code đọc và thực thi. Đây là **lệnh triển khai sản phẩm**, không chỉ là lệnh lập kế hoạch. Không cần hỏi lại các quyết định đã được khóa. Khi thiếu secret hoặc tài khoản dịch vụ, hãy hoàn thành mọi phần có thể chạy local và hướng dẫn tôi cấu hình, không bịa secret.
>
> **PHẠM VI:** Website luyện thi tốt nghiệp THPT (Việt Nam), một codebase Next.js cho cả frontend/backend, serverless modular monolith, MongoDB Atlas, Cloudinary, chi phí hạ tầng ưu tiên 0 đồng khi phát triển và chạy thử. Chưa nhập đề thi thật. Giao diện tiếng Việt, đơn giản, rõ ràng, responsive. Công cụ thực thi: Claude Code.

---

## 0. VAI TRÒ, NGUYÊN TẮC THỰC THI VÀ ĐỊNH NGHĨA HOÀN THÀNH

Bạn là **Principal Full-stack Engineer + Solution Architect + Security Reviewer + QA Engineer + UI/UX Engineer**. Nhiệm vụ là **xây dựng ứng dụng hoàn chỉnh chạy được**, không dừng ở pseudocode, mock screens, TODO, skeleton hoặc một kế hoạch. Bạn được quyền tạo/sửa file, cài dependency, viết migration/seed, chạy lệnh, tự sửa lỗi, kiểm thử và cập nhật tài liệu trong workspace do tôi cung cấp.

Hành động ngay theo các quy tắc:

1. Đầu tiên kiểm tra repository, `package.json`, Node/pnpm, git status, environment và các file có sẵn. Nếu workspace trống, khởi tạo dự án. Nếu đã có mã nguồn, giữ lại phần đang hoạt động và triển khai theo hướng tương thích, không xóa bừa bãi.
2. Tạo hoặc cập nhật `docs/PROJECT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/API_CONTRACTS.md`, `docs/SECURITY.md`, `docs/TEST_PLAN.md`, `docs/DEPLOYMENT.md`, `docs/PROGRESS.md` và `CLAUDE.md` (quy tắc cho các phiên Claude tiếp theo). Bản đặc tả trong prompt này ưu tiên cao hơn mọi giả định từ AI.
3. Chia việc thành 7 phase có checkpoint. **Bắt tay thực hiện Phase 1 ngay, rồi lần lượt thực hiện những phase tiếp theo trong cùng phiên khi có thể**. Đừng dừng lại ở đề xuất kế hoạch hoặc xin phép để bắt đầu. Ở mỗi phase: implement → typecheck → lint → test → build → sửa lỗi → cập nhật tiến độ → chuyển phase. Nếu bị giới hạn về thời gian/ngữ cảnh/tài nguyên, lưu tiến độ chi tiết và tiếp tục từ checkpoint ở phiên sau; không tuyên bố chưa làm là đã hoàn thành.
4. **Chỉ hỏi tôi khi thực sự cần**: tài khoản/secret dịch vụ, quyết định ảnh hưởng tới quyền riêng tư hoặc quyền truy cập mà prompt chưa quyết định, tác vụ phá hủy dữ liệu, hoặc nâng cấp dịch vụ có phí. Nếu một phần bên ngoài chưa cấu hình (MongoDB Atlas/Cloudinary/email/Vercel), triển khai code, mẫu `.env.example`, chức năng thông báo thiếu cấu hình rõ ràng, và kiểm thử phần có thể kiểm thử được. Tuyệt đối không tự tạo fake credentials, không cam kết triển khai production nếu chưa có secret.
5. Không thêm dịch vụ trả phí, không tạo tài khoản hoặc bật gói trả phí thay tôi; không tự `git push`, không thay đổi production database, không xóa dữ liệu đã có, không chạy lệnh phá hủy khi chưa được xác nhận.
6. Chọn các **phiên bản stable và tương thích tại thời điểm thực thi**, tra tài liệu chính thức và ghi lại các phiên bản thực tế trong `docs/ARCHITECTURE.md`. Không tự đoán API hiện hành của Next.js, Auth.js, Mongoose, Tailwind hay Cloudinary; tránh canary/beta nếu có lựa chọn stable hỗ trợ đầy đủ. Dùng lockfile.
7. Không dùng `any` bừa bãi, không dùng `@ts-ignore` để giấu lỗi, không bỏ qua ESLint, không đặt secrets vào code/client, không để dead buttons, không để route quan trọng là placeholder.
8. Mỗi khi báo một mục đã xong, phải ghi **đã chạy lệnh nào**, kết quả pass/fail, vấn đề còn tồn tại. Không nói “đã test” nếu chưa thực sự chạy. Các tích hợp yêu cầu dịch vụ bên ngoài thì đánh dấu `NOT VERIFIED — missing configuration` nếu chưa kiểm tra được.
9. Ngôn ngữ toàn bộ UI, thông báo, nhãn, nội dung DEMO và tài liệu hướng dẫn người dùng: **tiếng Việt**. Tên biến, tên file, type và comments kỹ thuật có thể bằng tiếng Anh, nhất quán.
10. Ưu tiên **đơn giản, dễ bảo trì, tốc độ ổn cho dự án nhỏ**, không overengineering. Chỉ đưa hạng mục vào MVP nếu được chỉ định rõ bên dưới.

**Định nghĩa “hoàn thành”:** Các luồng quan trọng hoạt động end-to-end trên môi trường đã có biến môi trường hợp lệ; bảo mật quyền và đáp án đạt kiểm thử; kiểm thử tính điểm và xếp hạng đạt; typecheck, lint, unit tests và production build không lỗi; hướng dẫn cấu hình, seed DEMO, run local, deploy đầy đủ; không có TODO nghiêm trọng bị giấu đi.

---

## 1. BỐI CẢNH SẢN PHẨM VÀ PHẠM VI KHÓA

**Tên tạm:** ExamHub THPT. Website luyện thi tốt nghiệp THPT Việt Nam, hỗ trợ học sinh ôn tập kiến thức theo môn/chủ đề và thi thử có thời gian; giáo viên xây dựng kho câu hỏi/đề thi; admin duyệt đề và quản lý hệ thống.

### 1.1. Những lựa chọn đã khóa, không hỏi lại

- **Nền tảng:** Web responsive, mobile-first; không làm native mobile app.
- **Frontend + Backend:** Duy nhất Next.js App Router + TypeScript strict; backend là Route Handlers/Server Components/Server Actions khi phù hợp, không tạo backend Express hoặc NestJS riêng.
- **Kiến trúc:** Serverless Modular Monolith, **Node.js runtime** cho code dùng MongoDB/Mongoose, Cloudinary hay thư viện native.
- **Dữ liệu:** MongoDB Atlas free + Mongoose; Cloudinary free lưu ảnh; không lưu ảnh base64 trong MongoDB.
- **Auth:** Auth.js Credentials (hoặc bản hỗ trợ stable tương thích, có giải thích nếu cần thay), username/email + mật khẩu; **Argon2id** cho password hash, tuyệt đối không lưu password SHA-256 thuần. Không có social login trong MVP.
- **Roles:** `STUDENT`, `TEACHER`, `ADMIN`. Admin tạo/duyệt tài khoản giáo viên; teacher tạo nội dung; chỉ admin duyệt xuất bản. User tự đăng ký là student.
- **Tài khoản:** khi đăng ký phải nhập username, email, mật khẩu, xác nhận mật khẩu; khi đăng nhập một ô `identifier` nhận username hoặc email, kèm password; username/email case-insensitive sau chuẩn hóa; không trùng.
- **Hình thức học:** luyện theo chủ đề, thi thử đếm giờ, làm lại không giới hạn; lưu lịch sử.
- **Các kiểu câu hỏi:** `SINGLE_CHOICE` (A/B/C/D), `TRUE_FALSE` (4 ý), `SHORT_ANSWER` (nhập số/chuỗi chuẩn hóa được theo cấu hình).
- **Môn:** cấu trúc dữ liệu và UI quản lý đủ các môn thi tốt nghiệp THPT dạng trắc nghiệm hiện hành; **Ngữ văn tự luận không nằm trong grading engine MVP**. Không hardcode số câu/thời lượng theo một năm.
- **Leaderboard:** riêng từng môn, tuần/tháng/năm, dựa trên **điểm trung bình của bộ đề chung** được admin tạo cho mỗi kỳ; yêu cầu hoàn thành toàn bộ đề trong bộ; **chỉ lượt đầu tiên** đối với từng đề được tính; làm lại không ảnh hưởng bảng xếp hạng.
- **Quản trị:** teacher có CRUD câu hỏi, tạo/sửa đề nháp/gửi duyệt; admin duyệt/từ chối và xuất bản, quản lý tài khoản/môn/chủ đề/bộ đề xếp hạng.
- **UI/UX:** tối giản, dễ đọc, thân thiện với học sinh, tiếng Việt, màu xanh/trắng/xám, light mode mặc định, ít animation, mobile-first.
- **Data:** Chưa có đề thật, không scraping/nạp đề thật. Seed bằng câu hỏi giả lập, ghi rõ `DEMO`, có thể reset/xóa không ảnh hưởng dữ liệu thật.
- **Free-first:** Không thêm AI API, SMS, Redis, Docker bắt buộc, queue trả phí, object storage khác, analytics trả phí, payment, captcha trả phí.

### 1.2. Chức năng ngoài phạm vi MVP

Không làm: thanh toán, gói VIP, AI chat/sinh đề, OCR PDF/Word, import PDF/Word phức tạp, mạng xã hội, livestream, native app, webcam proctoring, multi-tenancy, lớp học/phân công bài nhiều tầng, microservices, Redis/queue hoặc scheduler trả phí, realtime socket, cấu trúc tự luận Ngữ văn.

### 1.3. Những hành vi sản phẩm mặc định

- Khách chưa đăng nhập: trang chủ, danh sách môn, danh sách đề công khai, xem leaderboard (chỉ nickname công khai nếu người dùng opt-in); phải đăng nhập mới làm bài và xem lịch sử cá nhân.
- Học sinh: xem đề đã xuất bản, luyện tập, thi thử, xem kết quả theo release policy, làm lại, hồ sơ cá nhân, danh sách top.
- Giáo viên: nội dung thuộc quyền mình; không duyệt bài của mình hoặc xuất bản đề nếu không phải admin; có thể trải nghiệm thi như student nhưng **tài khoản teacher/admin không tham gia bảng xếp hạng học sinh**.
- Admin: toàn quyền quản lý hợp lệ, mọi thao tác xuất bản/khóa/xóa mềm được audit.
- Đề đang làm không được xóa cứng; version đề/câu hỏi/đáp án đã sử dụng không bị sửa ngầm.
- Mọi thời gian lưu UTC; tính tuần/tháng/năm theo `Asia/Ho_Chi_Minh`, tuần bắt đầu thứ Hai.

---

## 2. STACK, KIẾN TRÚC VÀ QUY TẮC KỸ THUẬT

### 2.1. Bắt buộc

- Next.js App Router, React, TypeScript strict, Node.js LTS tương thích; `pnpm`.
- Tailwind CSS + shadcn/ui (Radix), `lucide-react`; React Hook Form + Zod cho form.
- Mongoose, MongoDB Atlas; tối ưu connect cache/connection promise qua `globalThis` trong dev và per-instance reuse trong serverless, kiểm soát pool size và timeout. Không có MongoDB code trong client bundle; `server-only` khi phù hợp.
- Auth.js Credentials + secure session cookie HttpOnly/Secure/SameSite; CSRF protection theo cơ chế khuyến nghị của framework; email/username password verify với Argon2id.
- Cloudinary signed client-direct upload cho teacher/admin, server ký quyền/time/folder, bí mật chỉ server. Giới hạn định dạng JPEG/PNG/WebP, kích thước tối đa mặc định 3 MB/ảnh, quy tắc folder và xác minh metadata ảnh sau upload.
- KaTeX để hiển thị LaTeX an toàn trong câu hỏi/lời giải, không render HTML thô do user nhập; xử lý lỗi công thức đẹp.
- Vitest cho logic thuần, integration tests khi có môi trường DB test; Playwright cho E2E luồng chính.
- Zod validation input/query/body, error handler chuẩn, pagination cho list, request ID/log tối thiểu không chứa thông tin nhạy cảm.

### 2.2. Quy ước phân lớp

`app` đảm nhiệm route, page, layout, Route Handler. `modules/<domain>` gồm `schemas`/`models`, `repository`, `service`, `dto`, `validation`, `permissions`, `components` khi phù hợp. `lib` dùng cho DB, auth, cloudinary, validation chung. Không để logic nghiệp vụ dài bên trong `app/api/*/route.ts`; route chỉ xác thực, validate, gọi service, format response. Tách client/server code rõ ràng, không dùng Server Actions như cách bỏ qua kiểm tra authorization. Tránh circular dependencies.

### 2.3. Sơ đồ logic

Browser (desktop/mobile) → Next.js UI + Route Handlers (Vercel Serverless Node.js) → domain services → MongoDB Atlas. Cloudinary là media host; upload trực tiếp từ trình duyệt sau khi được server xác thực và ký. Không cần một Express server riêng, background worker bắt buộc hay WebSocket.

### 2.4. Caching và tính nhất quán

- Không cache công khai dữ liệu cá nhân, lượt thi, đáp án và leaderboard đang cập nhật sai chính sách. Với route nhạy cảm dùng cơ chế dynamic/no-store phù hợp phiên bản Next.js thực tế.
- Cache ngắn hoặc revalidation có kiểm soát cho môn/chủ đề/đề công khai; invalidate khi admin duyệt/sửa trạng thái.
- Dùng idempotency keys cho start/submit khi cần; optimistic concurrency hoặc revision cho autosave; unique indexes và atomic operations chống chạy song song.
- Không phụ thuộc scheduled cron trả phí: tính toán leaderboard theo yêu cầu, lưu snapshot khi admin chốt kỳ, có cơ chế reconcile lượt hết hạn theo lô nhỏ an toàn với serverless timeouts.
- Không tự tăng polling liên tục, không query toàn bộ `attempts` cho mỗi lượt xem dashboard.

---

## 3. MÔ HÌNH NGƯỜI DÙNG, AUTH VÀ QUYỀN

### 3.1. Form và xác thực

- Đăng ký: username, email, password, confirm password, đồng ý điều khoản/quyền riêng tư. Username 3–30 ký tự ASCII thường/số/`_`/`.` (đề xuất; document rõ); email chuẩn hóa lowercase/trim; password tối thiểu 10–12 ký tự, kiểm tra phổ biến yếu trong phạm vi hợp lý, không làm lộ chính sách nội bộ. Không gửi password/hash tới client response.
- Đăng nhập: identifier dạng email hoặc username, password; lỗi chung chung không tiết lộ username/email có tồn tại hay không. Argon2id async, thuật toán/cấu hình an toàn và khả thi trên Vercel. Nếu chọn package native, kiểm thử khả năng build/deploy Node.js.
- Auth.js session mặc định JWT hoặc chiến lược phù hợp stable, giải thích lựa chọn; ký/secret từ môi trường; tuyệt đối không localStorage tokens. Role/active status phải kiểm tra DB tại các thao tác nhạy cảm để thay đổi quyền/khóa tài khoản có hiệu lực, tránh JWT role stale. Có thể dùng `sessionVersion`/`tokenVersion` để thu hồi phiên. Không cache quyền nhạy cảm sai thời điểm.
- Profile: nickname riêng cho leaderboard, username, email, avatar (không bắt buộc), grade 10/11/12 (không bắt buộc), thời gian tạo. Người học có thể bật/tắt hiển thị leaderboard công khai, mặc định dùng biệt danh hoặc dạng che tên; không hiển thị email.
- `TEACHER` chỉ được admin tạo/approve; không cho phép client tự sửa role. Không hardcode admin email/pass trong repo. Có script `pnpm bootstrap:admin` an toàn chạy thủ công với ENV hoặc nhập từ stdin; phải idempotent, hạn chế production và không in secret.

### 3.2. Tính năng email và reset mật khẩu

- Không mặc định cho rằng có SMTP/domain/email provider miễn phí. Xây auth workflow với provider adapter có thể cấu hình qua biến môi trường; `auth_tokens` chỉ lưu hash token, purpose, expiry, usedAt, TTL index phù hợp.
- Trong development DEMO, cho phép tạo/login student không cần email thật khi cấu hình `REQUIRE_EMAIL_VERIFICATION=false` và hiển thị cảnh báo dev; không được đánh dấu email đã xác minh nếu chưa xác minh.
- Trong production public, khuyến nghị `REQUIRE_EMAIL_VERIFICATION=true` và chặn đăng ký/khôi phục qua email nếu thiếu cấu hình mail, hiển thị thông báo và hướng dẫn admin bật provider. Không hứa gửi email thành công nếu chưa gửi.
- Đổi mật khẩu phải yêu cầu mật khẩu hiện tại, thu hồi phiên nếu phù hợp. Quên mật khẩu dùng token một lần, hạn dùng ngắn, không tiết lộ sự tồn tại email qua response; mọi endpoint giới hạn tốc độ.

### 3.3. Security checklist

OWASP baseline: Argon2id, rate limiting login/signup/password reset/upload/submit; validate input; chống mass assignment; check session+RBAC+ownership tại service, không chỉ middleware; CSRF đối với cookie mutation theo framework; headers bảo mật và CSP khả thi, sanitize rich content, upload whitelist, không open redirect, không NoSQL injection (`$`/dot operator trong filter không tin cậy), không lộ stack trace/secrets. Cookie/session chính xác trên HTTPS. Giới hạn body size. Logging không chứa password, answer keys hoặc tokens.

Với dữ liệu học sinh có thể là người chưa thành niên: hạn chế thu thập, có trang thông báo quyền riêng tư, leaderboard dùng nickname, quyền ẩn tên, không công khai email/điểm chi tiết; khuyến nghị rà soát quy định bảo vệ dữ liệu cá nhân tại Việt Nam trước public launch.

---

## 4. DANH SÁCH MÔN, CẤU TRÚC ĐỀ VÀ BA LOẠI CÂU HỎI

### 4.1. Môn học/chủ đề

Có trang quản lý môn và chủ đề cây phân cấp. Seed danh mục môn mẫu hỗ trợ: Toán, Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, Giáo dục kinh tế và pháp luật, Tin học, Công nghệ Công nghiệp, Công nghệ Nông nghiệp và Ngoại ngữ (ít nhất Tiếng Anh, thiết kế cho các ngoại ngữ khác). **Không giả định** tất cả môn có đủ ba dạng câu; từng môn và từng năm cấu hình `allowedQuestionTypes`, `examSections`, `timeLimit`, `scoringRuleVersion` từ cơ sở dữ liệu. Ngữ văn tự luận không có chấm điểm tự động trong MVP.

Tham chiếu văn bản chính thức hiện hành ở lúc build; đừng tự tuyên bố bộ đề DEMO giống 100% đề chính thức. Bảng điểm, phần thi, số câu, thời gian và policy công bố lời giải là config quản trị, có version.

### 4.2. SINGLE_CHOICE

- Có đúng 4 phương án với IDs ổn định, chọn **một**. Đảo thứ tự nếu có làm được một cách nhất quán và không làm lộ đáp án; bản MVP có thể giữ thứ tự để giảm rủi ro. Điểm theo quy tắc câu/section.
- `question_versions.content` lưu `stem`, `options` (id/text/media), tags, image refs; `question_keys` lưu correctOptionId và explanation/accepted variations nếu cần.

### 4.3. TRUE_FALSE

- Mỗi câu có **chính xác 4 ý** a/b/c/d, mỗi ý `true` hoặc `false`; cho phép chưa trả lời từng ý, không tự ép câu chưa làm thành false.
- Scoring theo `scoring_rules` phiên bản có cấu hình `pointsByCorrectCount` cho 0,1,2,3,4 ý đúng (ví dụ DEMO 0/0.1/0.25/0.5/1.0, không hardcode như chân lý mọi năm). Số ý đúng tính chính xác, ý bỏ trống không được tính đúng.
- Kết quả thể hiện đúng/sai từng ý và giải thích sau khi được công bố.

### 4.4. SHORT_ANSWER

- Trả lời ngắn là số hoặc chuỗi chuẩn hóa theo cấu hình câu; default hỗ trợ kết quả số, âm/dương, dấu phẩy/dấu chấm thập phân, khoảng trắng, làm tròn/độ chính xác và dung sai **chỉ khi câu hỏi cấu hình rõ**. Tránh coi `1,5` với `15` giống nhau; không tùy ý eval biểu thức người dùng.
- Có `acceptedAnswers`, `answerType`, `normalization`, `tolerance` hoặc `decimalPlaces` khi phù hợp; xử lý số lớn chính xác bằng decimal.js hoặc thư viện Decimal tương đương, tránh JS binary float trong điểm số. Lời giải riêng.

### 4.5. Nội dung rich text an toàn

Ưu tiên nội dung theo block hoặc plain text + LaTeX, ảnh Cloudinary reference, không tùy tiện nhúng HTML. Renderer hỗ trợ xuống dòng, superscript, KaTeX, hình minh họa có alt; tránh XSS. Form biên tập đơn giản, live preview, báo lỗi LaTeX.

---

## 5. MONGODB DATA MODEL — YÊU CẦU CHI TIẾT

Tạo các Mongoose schemas/types, domain validators, indexes, timestamps, versioning và repositories rõ ràng. Không dùng SQL hay Prisma. Tất cả IDs dùng ObjectId/UUID thống nhất, API không tiết lộ fields riêng. Dữ liệu cá nhân/đáp án không được gửi qua `.lean()` thiếu projection có kiểm soát.

### 5.1. `users`

`_id`, `username`, `usernameNormalized`, `email`, `emailNormalized`, `passwordHash` (`select:false`), `role` (`STUDENT|TEACHER|ADMIN`), `status` (`ACTIVE|SUSPENDED`), `displayName`, `grade?`, `leaderboardVisibility`, `emailVerifiedAt?`, `sessionVersion`, `createdAt`, `updatedAt`, `lastLoginAt?`. Unique indexes cho normalized username/email. Public profile chỉ gồm nickname và avatar tùy chọn.

### 5.2. `subjects`

`_id`, `name`, `slug` unique, `code`, `examYearsSupported?`, `allowedQuestionTypes`, `isActive`, `sortOrder`, timestamps. Seed nhiều môn DEMO/metadata; không seed đề thật.

### 5.3. `topics`

`_id`, `subjectId`, `parentId?`, `name`, `slug`, `grade?`, `sortOrder`, `isActive`; compound unique phù hợp parent/subject/slug; index lọc subject/parent.

### 5.4. `questions`

`_id`, `subjectId`, `topicIds[]`, `type`, `difficulty` (`EASY|MEDIUM|HARD`), `createdBy`, `ownerId`, `status` (`DRAFT|IN_REVIEW|PUBLISHED|ARCHIVED` hoặc trạng thái phù hợp), `latestVersionId`, `publishedVersionId?`, `tags[]`, `isDemo`, timestamps. Không nhúng answer key vào API-facing question.

### 5.5. `question_versions`

`_id`, `questionId`, `versionNumber`, `type`, `content` (discriminated schema theo type), `media[]` (`publicId`, `secureUrl`, `width`, `height`, `alt`, `resourceType`), `createdBy`, `createdAt`, `contentHash?`, `isImmutable`. Unique `(questionId,versionNumber)`. Published version hoặc version đã được đề thi dùng **bất biến**, muốn sửa tạo version mới. Có preview admin/teacher có quyền.

### 5.6. `question_keys`

`_id`, `questionVersionId` unique, `answerData` phù hợp type, `explanation` (safe text/LaTeX), `gradingConfig?`, timestamps. Collection/server service chỉ privileged grader và editor có quyền sử dụng; **không có API student trả trực tiếp collection này trước release policy**. Tách riêng collection là defense-in-depth, không thay thế kiểm soát projection/authorization.

### 5.7. `scoring_rules`

`_id`, `name`, `subjectId`, `examYear`, `version`, `sections[]`, `typeRules` (choice, trueFalse mapping, shortAnswer), `maxScore=10`, `roundingPolicy`, `status`, `createdBy`, timestamps; phiên bản published bất biến. Có DEMO scoring rules, không giả danh quy định mới nếu chưa kiểm chứng.

### 5.8. `exams`

`_id`, `title`, `slug?`, `description`, `subjectId`, `examYear`, `mode` (`PRACTICE|MOCK`), `difficulty?`, `durationMinutes?`, `items[]` (ordered `questionVersionId`, `sectionId`, `pointsRuleRef?`, `position`), `scoringRuleId`, `totalMaxRawPoints`, `publishStatus` (`DRAFT|PENDING_REVIEW|PUBLISHED|REJECTED|ARCHIVED`), `createdBy`, `reviewedBy?`, `reviewNotes?`, `publishedAt?`, `resultReleasePolicy`, `isDemo`, `revision`, timestamps. Published content immutable; clone/revision on edit. Validate all items existing, same subject/type allowed, no duplicate unintended, scoring rule complete, nonempty, total points > 0.

### 5.9. `attempts`

`_id`, `userId`, `examId`, `examRevisionOrSnapshot`, `mode`, `startedAt`, `expiresAt` (mock), `submittedAt?`, `finalizedAt?`, `status` (`IN_PROGRESS|SUBMITTED|EXPIRED|FINALIZED`), `answers` embedded array/object keyed stable examItemId/questionVersionId, `revision`, `gradeResult?` (per-item score, summary), `scoreScaled?` integer 0..10000 representing 0..10.0000, `maxScoreScaled=10000`, `isFirstRankedAttempt`, `rankingCampaignIds?`, `idempotencyKey?`, timestamps. Giới hạn kích thước attempt; lưu đáp án từng câu nhỏ là hợp lý cho đề thi THPT. Không lưu plaintext correct answers trong attempt trước khi kết thúc, chỉ refs/scores.

### 5.10. `user_exam_progress`

`_id`, `userId`, `examId`, `firstAttemptId`, `firstStartedAt`, `attemptCount`, `lastAttemptId`, timestamps. Unique `(userId,examId)`. **Lượt đầu tiên xác định bằng thao tác đăng ký lượt bắt đầu nguyên tử**, không chọn lượt có điểm cao nhất; xử lý concurrent start và lỗi giữa nhiều bước bằng transaction nếu cluster/driver hỗ trợ hoặc thiết kế idempotent + repair an toàn. Có tests race conditions. Attempts của teacher/admin không đủ điều kiện rank.

### 5.11. `ranking_campaigns`

`_id`, `subjectId`, `periodType` (`WEEK|MONTH|YEAR`), `periodStartAt`, `periodEndAt`, `timezone='Asia/Ho_Chi_Minh'`, `examIds[]` ordered, `status` (`DRAFT|ACTIVE|CLOSED|ARCHIVED`), `minimumCompletion=all`, `createdBy`, `activatedAt`, `finalizedAt`, timestamps. Admin tạo bộ đề cố định, không sửa danh sách khi kỳ đã active. Mỗi đề có tính hợp lệ theo campaign; **khuyến nghị dùng exam ID riêng cho mỗi bộ đề/kỳ** để tránh người dùng đã làm trước đó hoặc kỳ chồng chéo làm mất tính công bằng. Khi admin kích hoạt, validate không chứa đề chưa published, không có câu trả lời bị công bố sớm, không có đề đã được học sinh hoàn thành trước kỳ nếu quy tắc đó gây bất công. Không tự tạo hàng trăm campaign trống.

### 5.12. `ranking_snapshots`

`_id`, `campaignId`, `subjectId`, `periodType`, `generatedAt`, `isFinal`, `entries[]` hoặc cấu trúc phân trang phù hợp dữ liệu (có thể một document/entry cho quy mô mở rộng), `calculationVersion`. Mỗi entry: `userId`, `displayNameSnapshot`, `scoreAverageScaled`, `scoreSumScaled`, `correctCount`, `completedAt`, `rank`. Không để document vượt 16MB. Có thể tính on-demand khi nhỏ, và snapshot kỳ closed sau reconcile; không cần cron. Index theo campaign/rank/user.

### 5.13. `auth_tokens`

`userId?`, `identifierHash?`, `tokenHash`, `purpose` (`VERIFY_EMAIL|RESET_PASSWORD`), `expiresAt`, `usedAt?`, `createdAt`. TTL indexes. Never log/store plaintext token; response quên mật khẩu không tiết lộ user existence.

### 5.14. `audit_logs`

`actorId`, `action`, `entityType`, `entityId`, `metadata` được lọc PII/secrets, `createdAt`. Index actor/date/entity. Ghi sự kiện tạo teacher, chỉnh role, review/reject/publish/unpublish, campaign activation/finalization và thao tác bảo mật.

### 5.15. Lưu trữ file

Trong MongoDB chỉ giữ media `publicId`/`secureUrl`/metadata Cloudinary; Cloudinary free không dùng như kho tài liệu nhạy cảm. Không cho user tùy ý chèn external URL không xác minh. Khi cập nhật/xóa câu hỏi phải tính toán asset usage refs trước khi xóa media; ưu tiên soft delete, không xóa ảnh đang được referenced bởi published version.

### 5.16. Indexes và dữ liệu tham chiếu

Thiết lập tối thiểu: `users.usernameNormalized` unique, `users.emailNormalized` unique; `topics(subjectId,parentId,slug)`; `questions(subjectId,status,type,difficulty)`; `question_versions(questionId,versionNumber)` unique; `question_keys.questionVersionId` unique; `exams(subjectId,publishStatus,mode,publishedAt)`; `attempts(userId,examId,startedAt desc)`, `attempts(userId,status,startedAt desc)`; `user_exam_progress(userId,examId)` unique; `ranking_campaigns(subjectId,periodType,periodStartAt)`, `ranking_snapshots(campaignId,rank)`; email token TTL. MongoDB không enforce foreign keys: service phải kiểm tra refs và bảo vệ xóa. Bổ sung index sau khi đo query patterns, không tạo hàng chục index dư thừa.

---

## 6. EXAM ENGINE — LUỒNG THI BẮT BUỘC

### 6.1. Hai mode

**PRACTICE:** Student chọn môn/chủ đề/độ khó/số câu theo giới hạn, hệ thống tạo session luyện tập từ bank đã xuất bản; không tính rank, có thể xem kết quả/lời giải sau hoàn thành. Trường hợp chưa đủ câu hiển thị thông báo dễ hiểu; không giả số lượng. Có thể sử dụng exam mode PRACTICE hoặc generate attempt snapshot từ question pool, nhưng giữ logic grading dùng chung.

**MOCK:** Student mở đề published, thấy mô tả, số câu, thời gian, quy tắc tính điểm và chính sách xem lời giải. Khi bấm bắt đầu, server tạo attempt snapshot và `expiresAt` bằng thời gian server. UI đếm ngược chỉ phản ánh expiry server, không phải nguồn chân lý. Đề có thể cấu hình thuộc campaign xếp hạng.

### 6.2. Bắt đầu thi

- `POST /api/attempts`: check user, exam published, owner role, campaign validity/visibility, idempotency key; giới hạn concurrent attempts hợp lý. Cho làm lại không giới hạn nhưng không tạo hai lượt “đầu tiên”. Tạo snapshot of exam item IDs/version refs, scoring rule version, option ordering nếu có. `user_exam_progress` chọn firstAttempt atomically. Trả về content **không bao gồm correct answers/explanations** chưa được phép công bố. Nếu retry cùng key trả cùng attempt.
- Không cho học sinh submit một `examId`/`questionVersionId` tự đặt để truy cập nội dung chưa publish.

### 6.3. Trong lúc làm

- UI có progress số câu, điều hướng câu, đánh dấu câu để xem lại, previous/next, confirmation submit, timer, autosave status (`Đang lưu`/`Đã lưu`/`Lỗi mạng, thử lại`), keyboard accessible.
- `PATCH /api/attempts/:id/answers`: check attempt owner, status `IN_PROGRESS`, clock chưa hết, payload chỉ các item thuộc snapshot, validate answer by question type, revision optimistic concurrency, upsert answer idempotent; trả revision/serverTime/savedAt. Không cho sửa khi finalized/expired.
- Debounce 1–3 giây, lưu khi chuyển câu/ẩn tab, retry có giới hạn khi mạng trở lại; không lưu hash/đáp án đúng ở browser. Có thể giữ bản nháp ngắn hạn trong memory để tránh mất thao tác nhưng server là source of truth.
- Hai tab conflict: revision mismatch trả 409 và UI giải thích/tải lại version mới; không ghi đè âm thầm.

### 6.4. Nộp và hết giờ

- `POST /api/attempts/:id/submit`: finalize **chính xác một lần**, điểm server tính; nhiều lần submit, retry cùng request trả cùng kết quả. Use atomic state transition; kiểm soát concurrent submissions. Chỉ chấm câu trả lời đã lưu, không cho thay đổi sau khi chốt.
- Khi hết hạn: backend tự từ chối sửa đáp án và finalize dựa trên nội dung đã lưu, qua `GET`/`submit`/admin bounded reconciliation; không dựa vào setTimeout frontend hay cron trả phí. Nếu user không quay lại, admin có lệnh reconcile hết hạn theo batch khi chốt campaign. Tính rõ chính sách zero answer = 0 và partial answers.
- `GET /api/attempts/:id` cho resume nếu chưa hết hạn; nếu hết hạn thì finalize an toàn và redirect kết quả.

### 6.5. Chấm bài

Tạo pure functions `gradeSingleChoice`, `gradeTrueFalse`, `gradeShortAnswer`, `gradeExam` với typing rõ; chấm từ snapshot + question keys private + scoring rule frozen; không tin `score` do client gửi. Tính bằng Decimal an toàn, chuẩn hóa về thang 10 và lưu scaled integer, round tại một điểm xác định; validate max points > 0, max score 10, không thể âm. Trả per-item awarded/max sau khi release allowed. Trường hợp thay đổi answer key sau published phải tạo version/regrade có audit/approval, không làm thay đổi lịch sử âm thầm.

### 6.6. Chính sách công bố đáp án

`resultReleasePolicy` hỗ trợ `AFTER_SUBMISSION`, `AFTER_CAMPAIGN_END`, `ADMIN_MANUAL`. Đối với đề thuộc leaderboard đang mở, mặc định **không công bố đáp án đúng, lời giải hoặc per-item exact correctness trước khi campaign kết thúc**, tránh học sinh làm lượt đầu muộn lợi dụng bài làm lại; chỉ hiển thị trạng thái và điểm tổng theo policy, hoặc trì hoãn điểm nếu config yêu cầu. Kể cả student đã submit hoặc teacher/admin có quyền thi, public endpoints không được leak answer keys của campaign đang active. Teacher editor được xem đáp án của nội dung mình sở hữu qua authenticated editor route; admin qua quyền kiểm duyệt.

---

## 7. LEADERBOARD — THUẬT TOÁN KHÓA

### 7.1. Nguyên tắc

Mỗi `ranking_campaign` chứa bộ đề chuẩn `examIds[]` cho **một môn** và **một khoảng thời gian** tuần/tháng/năm. Admin tạo/duyệt/kích hoạt. Chỉ `STUDENT`, tài khoản active, đủ điều kiện visibility, có **lượt đầu tiên** ở **toàn bộ đề** trong kỳ (bắt đầu hợp lệ trong `[start,end)`) và đã được finalize, mới đủ điều kiện bảng xếp hạng chính. Những lần làm lại không tăng điểm rank. Nếu student chưa đủ đề, chỉ hiển thị `đã hoàn thành m/n`, không xếp hạng chính.

**Lưu ý sản phẩm:** Để tuần/tháng/năm đồng thời công bằng, ưu tiên các campaign với bộ đề riêng, không dùng lại cùng exam ID đã được thí sinh làm trước đó. Có thể tái sử dụng câu hỏi đã có qua version refs nhưng một exam instance riêng cho campaign. Validate và cảnh báo admin về exam reuse, campaign overlapping và đề đã lộ đáp án.

### 7.2. Điểm và tie-break

Mỗi đề có `scoreScaled` (0–10000 tương ứng 0–10). `averageScaled = round(sum(scoreScaled)/N)` bằng integer math với một quy tắc rounding duy nhất. Hiển thị `averageScaled / 1000` rồi làm tròn 2 chữ số thập phân (điểm từ 0.00–10.00); lưu số chính xác scaled để xếp hạng, **không sort bằng chuỗi điểm hiển thị**.

Sắp xếp: (1) averageScaled giảm dần; (2) tổng số đơn vị/câu đúng có thể so sánh theo normalized correctness được xác định, hoặc nếu không đồng nhất các dạng câu hãy ưu tiên `sum(scoreScaled)`/thời điểm; (3) thời điểm hoàn thành toàn bộ bộ đề sớm hơn; (4) userId ổn định để deterministic. Vì `sumScore` = `average×N` cùng bộ đề nên không có tác dụng tie-break thực tế; ưu tiên `completedAt` nếu không có metric correctness so sánh hợp lệ. **Không phát minh luật tie-break vô nghĩa.** Đề xuất: `averageScaled DESC`, `completionTime ASC`, `userId ASC`, document rõ.

Kỳ được tính theo `Asia/Ho_Chi_Minh`, week Mon–Sun, start inclusive/end exclusive; dùng thư viện ngày có hỗ trợ timezone nếu cần. API pagination Top 10/50/100 và vị trí tôi; ẩn email và thông tin nhạy cảm; nếu user opt out, không công khai nickname (quy định xử lý người opt out rõ: không show public và xếp hạng nội bộ vẫn có thể lưu cho user). Admin có dashboard xem completeness.

### 7.3. Luồng đóng campaign

- `DRAFT` → `ACTIVE` (chỉ admin; validate đủ đề published, nonempty, times sane, no leaks).
- Khi kỳ hết: không cho attempt mới đủ điều kiện rank; các attempts đã bắt đầu trước end nhưng chưa hết hạn phải có chính sách: **phải hoàn tất trước `periodEndAt`** để đủ điều kiện rank; có thể kết thúc session sau period end để học tập, nhưng không được tính rank. Khi admin `Finalize`, reconcile expired attempts batch-safe trước tính; tạo immutable snapshot; đánh dấu `CLOSED`.
- Trong kỳ: on-demand query/aggregate tối ưu, nếu load lớn có cache ngắn hợp lý; sau khi closed dùng snapshot immutable để không tính lại trên mỗi request.
- Chỉ tính attempt đầu tiên; nếu attempt đầu tiên hết giờ/bỏ dở, finalize theo câu đã lưu hoặc 0, không chuyển lượt hai thành first.
- Chống sửa campaign active, đổi cấu trúc đề hoặc điều chỉnh điểm cũ trái phép. Mọi thay đổi chính sách cần version+audit.

### 7.4. Kiểm thử xếp hạng

Bắt buộc test: user hoàn thành 1/3 đề không xuất hiện; hoàn thành 3/3 chính xác average; làm lại được 10 điểm không thay đổi rank first; lần đầu 0 do bỏ dở vẫn giữ first; 2 lần start đồng thời có 1 first; campaign start/end timezone Vietnam; hòa điểm stable; tách môn; teacher/admin không tham gia; quyền private nickname; kỳ closed snapshot không bị sửa khi dữ liệu mới xuất hiện.

---

## 8. CRUD GIÁO VIÊN VÀ QUY TRÌNH ADMIN DUYỆT

**Question management:** teacher tạo câu hỏi theo môn/chủ đề/loại/độ khó, nhập nội dung/LaTeX/ảnh, chọn correct answers và explanation, preview, save draft, send for review; question edits tạo version mới. Validate không xuất bản câu hỏi thiếu đáp án hoặc không khớp kiểu. Quản lý danh sách có filter, pagination, search đơn giản, trạng thái và thao tác rõ.

**Exam builder:** teacher chọn môn/mode/năm/thời lượng/quy tắc điểm, chọn question versions đã eligible, sắp xếp thứ tự/section, xem tổng điểm, preview đề không kèm answer keys trong student mode, lưu draft, gửi admin duyệt. Admin có danh sách pending với mô tả, preview cả nội dung và đáp án trong secure admin context, duyệt hoặc từ chối có lý do; publish/unpublish/soft-delete có audit. Sau publish, không sửa trực tiếp; clone revision/draft mới.

**Admin user management:** danh sách students/teachers, tạo teacher bằng username/email và cơ chế đặt mật khẩu an toàn/khởi tạo mật khẩu tạm buộc đổi nếu có; khóa/bật user; role changes qua admin action with audit. Không cho admin tự hạ quyền admin cuối cùng mà khóa hệ thống; không lộ hash.

**Subjects/topics admin:** CRUD có kiểm tra slug unique, không xóa cứng nếu đã tham chiếu. UI dễ thao tác, thông báo rõ khi không thể xóa.

**Ranking admin:** tạo, xem/activate campaign, chọn bộ đề riêng, xem điều kiện hợp lệ, preview thời gian (timezone VN), đóng campaign/reconcile/snapshot, xem học sinh đủ/thiếu đề. Không tự động chuyển trạng thái dựa trên cron không tồn tại; trạng thái ACTIVE có thể được xác định theo time + config khi đọc, nhưng finalize thực hiện an toàn.

---

## 9. API CONTRACTS — HỢP ĐỒNG CẦN TRIỂN KHAI

Thiết kế REST-ish endpoints nhất quán, viết `docs/API_CONTRACTS.md` mô tả method, auth, role, input Zod, response, error. Có thể tinh chỉnh URL nhưng phải giữ chức năng và không đổi lung tung. JSON response ví dụ `{ success: true, data, meta? }` hoặc `{ success:false,error:{code,message,details?} }`; HTTP status chính xác 400/401/403/404/409/422/429/500, không trả stack trace.

**Auth:** `POST /api/auth/register`, Auth.js signin/signout/callback, `GET /api/me`, `PATCH /api/me`, `POST /api/auth/change-password`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/verify-email` khi mail provider configured.

**Public:** `GET /api/subjects`, `GET /api/subjects/:id/topics`, `GET /api/exams` published filters/pagination, `GET /api/exams/:id` metadata only, `GET /api/rankings` (subject/period/campaign/pagination) with private-safe projection.

**Student:** `GET /api/practice/options`, `POST /api/practice/sessions` (mới, không rank), `POST /api/attempts`, `GET /api/attempts`, `GET /api/attempts/:id`, `PATCH /api/attempts/:id/answers`, `POST /api/attempts/:id/submit`, `GET /api/attempts/:id/result`, `GET /api/me/stats`, `GET /api/me/ranking-progress`. Security check userId from session, never request userId trust.

**Teacher/admin:** `GET/POST /api/manage/questions`, `GET/PATCH/DELETE /api/manage/questions/:id`, `POST /api/manage/questions/:id/versions`, `POST /api/manage/questions/:id/request-review` if workflow requires; `GET/POST /api/manage/exams`, `GET/PATCH /api/manage/exams/:id`, `POST /api/manage/exams/:id/submit-review`, `POST /api/manage/uploads/signature`; admin `GET /api/admin/reviews`, `POST /api/admin/exams/:id/approve`, `POST /api/admin/exams/:id/reject`, `GET/POST /api/admin/teachers`, `PATCH /api/admin/users/:id/status`, `GET/POST /api/admin/ranking-campaigns`, `POST /api/admin/ranking-campaigns/:id/activate`, `POST /api/admin/ranking-campaigns/:id/finalize`. Phân quyền chắc chắn ở service, không chỉ ở đường dẫn.

**Response content separation:** Public/student GET exam/attempt không chứa `question_keys`, đáp án, giải thích chưa release, các hidden fields. Teacher/admin APIs chỉ lấy secrets theo quyền rõ ràng, sanitize logs.

**API safeguards:** input size limit; paging default limit ≤20, max ≤100; validate ObjectId safely; any invalid id returns controlled 400/404 not 500; ETag/revision for edits; `Cache-Control: private, no-store` for auth/attempt/result; status codes rõ. Với API mutation cookie-auth cần CSRF/origin protections phù hợp và chống truy cập cross-origin trái phép.

---

## 10. UI/UX, TRANG VÀ THIẾT KẾ CHI TIẾT

### 10.1. Design system

Tiếng Việt, **phong cách tối giản**. Light mode: neutral backgrounds, xanh dương primary, xanh lá cho thành công, đỏ cho lỗi, vàng cho cảnh báo; không dùng neon/gradient lớn/glassmorphism tràn lan. Typography thân thiện Unicode tiếng Việt (font nguồn hợp lệ, không bắt user tải thủ công); body 14–16px tương đương, heading rõ, spacing nhất quán, buttons đủ lớn cho touch, contrast đạt WCAG AA khi khả thi. shadcn/ui dùng Card/Button/Input/Select/Tabs/Badge/Table/Dialog/Toast/Skeleton. Icon lucide vừa phải. Dark mode không bắt buộc.

### 10.2. Trang công khai

- `/`: hero ngắn gọn “Luyện thi THPT hiệu quả”, nút “Bắt đầu luyện tập”, lựa chọn môn, đề thi mới, lý do sử dụng; không dùng số liệu users/đề giả như thật.
- `/mon-hoc` và `/mon-hoc/[slug]`: danh sách môn/chủ đề, trạng thái nếu chưa có đề.
- `/de-thi`: filter môn, độ khó, năm, mode, search, phân trang, trạng thái không có dữ liệu.
- `/de-thi/[id]`: giới thiệu đề, môn, số câu, thời lượng, số lượt, điều kiện rank, chính sách kết quả, nút bắt đầu.
- `/bang-xep-hang`: select môn, tab Tuần/Tháng/Năm, campaigns, top table và progress cá nhân khi login, message `Chưa có kỳ xếp hạng` khi trống.
- `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau` và `chinh-sach-rieng-tu`/`dieu-khoan` đơn giản nhưng có nội dung căn bản.

### 10.3. Trang student

- `/dashboard`: chào mừng theo nickname, CTA luyện tập, tiếp tục lượt thi đang mở, kết quả gần nhất, quick links môn và leaderboard.
- `/luyen-tap`: bộ lọc môn/chủ đề/độ khó/số câu, start practice và empty-state.
- `/lam-bai/[attemptId]`: desktop khu vực câu hỏi lớn bên trái, panel số câu/timer bên phải; mobile sticky bar/overlay danh sách câu; input tối ưu 3 dạng, đánh dấu xem lại, auto-save status, xác nhận nộp, cảnh báo hết giờ; chống double submit; hỗ trợ keyboard/aria và focus.
- `/ket-qua/[attemptId]`: score thang 10, thời gian, số câu hoàn thành, thống kê dạng câu, lời giải theo release policy; nếu chưa được xem đáp án phải hiển thị lý do và thời điểm công bố (nếu biết), **không leak qua response**.
- `/lich-su`: filter môn/mode, phân trang, trạng thái và điểm; click xem chi tiết.
- `/ho-so`: username, email, nickname, lớp tùy chọn, đổi mật khẩu, quyền public leaderboard, logout.

### 10.4. Teacher/admin dashboards

- Teacher `/giao-vien`: số câu hỏi của tôi, đề nháp/chờ duyệt/đã xuất bản, CTA tạo câu hỏi/tạo đề.
- Question editor: step rõ ràng, preview câu, lựa chọn type; upload ảnh kèm alt; form Zod validation và confirmation unsaved changes.
- Exam builder: metadata + search/select questions + ordered list + config score/duration + preview + send review.
- Admin `/quan-tri`: users, teacher accounts, review queue, subject/topic settings, ranking campaigns, audit list. Tuyệt đối không chỉ render nút mà không có backend.

### 10.5. UX bắt buộc

Tất cả trang có loading skeleton, empty states, error/retry, toast success, form errors bằng tiếng Việt, confirm thao tác nguy hiểm, responsive 360px–desktop. Không có horizontal overflow ở 360px; form dễ dùng trên điện thoại. SSR để tốc độ tải trang/SEO public khi hợp lý, client components chỉ khi cần state/interactivity. Không dùng popup quảng cáo.

---

## 11. CLOUDINARY VÀ XỬ LÝ ẢNH

1. Teacher/Admin chọn ảnh trong editor. Client kiểm tra JPG/PNG/WebP, ≤3MB. Server kiểm tra quyền người dùng, rate limit, tạo chữ ký upload thời gian ngắn với folder/preset/transform parameters **do server chỉ định**; trả signature/time/cloudName/apiKey public, **không trả API secret**.
2. Browser upload trực tiếp Cloudinary qua HTTPS, không proxy file bytes qua Next.js Function trừ khi bắt buộc và có kiểm soát.
3. Client gửi metadata upload về API; backend verify Cloudinary asset identity/resource fields (không tin một URL tùy ý), chỉ accept asset folder dự án; lưu publicId/secureUrl/width/height/format/bytes/alt; Cloudinary URL dùng allowlisted host/Next image remotePatterns.
4. Không cho upload SVG/HTML/file executables; không dùng user input làm folder/path tùy ý; tránh unbounded transformations, auto-generate video, ảnh quá lớn. Xóa ảnh cũ chỉ nếu không còn phiên bản đã xuất bản nào tham chiếu.
5. Nếu chưa có Cloudinary ENV, giao diện biên tập văn bản không bị crash; upload thể hiện thông báo rõ `Chưa cấu hình Cloudinary`.

---

## 12. FREE TIER, DEPLOYMENT VÀ VẬN HÀNH

**Mục tiêu:** Khi dev và chạy thử cá nhân, dùng hạ tầng free trong quota. **Không cam kết 0 đồng cho lưu lượng lớn hoặc thương mại.** Vercel Hobby hiện dành cho mục đích cá nhân, phi thương mại; nếu sau này kiếm tiền/mở hoạt động thương mại, cần xem lại license/plan hoặc chọn host phù hợp, không mặc nhiên khuyên cứ dùng Hobby.

- Vercel Hobby: deploy Next.js; kiểm tra giới hạn function invocation/time/CPU/bandwidth và build cho phiên bản thời điểm deploy. Không tự đăng ký gói Pro hay bật tính năng tính phí.
- MongoDB Atlas Free: theo dõi dung lượng (~512 MB theo pricing hiện được công bố), connection limits, throughput, network access; index tiết kiệm, pagination, lazy data loads, không lưu hàng triệu log hoặc ảnh. Cấu hình IP allowlist hợp lý; vì Vercel Hobby egress IP có thể không cố định, **phải minh bạch nếu buộc mở access rộng**, tài khoản DB quyền tối thiểu + strong secrets/TLS/monitor; không quảng cáo `0.0.0.0/0` là an toàn.
- Cloudinary Free: kiểm tra credits/transformations; giới hạn upload đầu vào và hiển thị thống kê usage để người vận hành biết quota.
- Email: không chọn gói trả phí. Nếu dùng dịch vụ email miễn phí, cần đọc quota, domain verification; nếu chưa có thì triển khai adapter/no-op development có cảnh báo, không giả gửi email thành công.
- Không phụ thuộc cron/scheduler để thành công của bài thi. Khi đóng campaign admin chạy reconcile theo batch có phân trang/cursor và idempotency.
- Environment variables tối thiểu: `MONGODB_URI`, `MONGODB_DB_NAME`, `AUTH_SECRET` (và biến Auth.js phiên bản chọn), `AUTH_URL`/trustHost khi cần, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_APP_URL`, mail provider env tùy chọn, verification feature flag. `.env.example` chỉ placeholder, `.env.local` gitignored, **không đưa env thật lên git**.
- README hướng dẫn từng click tạo MongoDB Atlas Free cluster, tạo DB user, Network Access, connection string, tạo Cloudinary Free product environment, lấy credentials, cấu hình Vercel project và ENV, production smoke test. Đưa thông tin giới hạn Hobby phi thương mại và nhắc kiểm tra điều khoản hiện hành.
- Có `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm seed:demo`, `pnpm bootstrap:admin`. Script có dry-run/confirm thích hợp, idempotent, không thao tác production khi chưa xác nhận.
- Logging ngắn, audit không lộ PII; chuẩn bị hướng dẫn backup/restore MongoDB với cảnh báo lệnh thực hiện, không tự xóa collection.

---

## 13. TEST PLAN — KHÔNG THỎA HIỆP

### 13.1. Unit tests

- Grading 3 kiểu: chọn đúng/sai/không chọn; đúng/sai 0/1/2/3/4 ý; missing statement; short answer `1,5`/`1.5`, `-2`, leading/trailing spaces, tolerance, invalid strings, precision; Max score 10, rounding stable, không vượt/max âm.
- Auth validators: username/email uniqueness normalization, weak password rejection, all roles enforce; mock password hash verification only in pure unit.
- Ranking: complete N/N, incomplete, first vs retake, timezone crossing week/month/year, equal averages, privacy opt-out, campaign edge times.
- Versioning/public visibility: published question version không sửa, editor permissions/owner checks.

### 13.2. API / integration

- Unauthorized/forbidden returns 401/403; student cannot create/publish question; teacher cannot publish; teacher cannot edit other's private item; admin can review.
- `GET /api/exams/:id`/attempt while live **does not include correct answer, explanation, private scoring secrets**, kể cả nested keys/JSON.
- 2 concurrent `POST attempts`/idempotency requests -> exactly 1 first attempt; 2 submits -> only one finalized result; autosave conflict 409; expired attempt prevents changing answers; invalid MongoDB ID handled.
- Signed upload denied for student, secret never serialized, metadata validation.
- Campaign active immutable, time boundary and snapshot consistency.

### 13.3. E2E journeys

1. Seed demo + bootstrap admin (test env) → register student → login username → logout → login email.
2. Admin creates teacher → teacher creates sample question each of 3 types → makes exam draft → admin rejects with reason → teacher revises → admin approves/publishes.
3. Student starts mock → answers/save → refresh/resume → submits → sees score and explanation only when policy allows.
4. Student retakes same mock → personal history has both attempts → ranking first attempt remains unchanged.
5. Admin creates weekly math campaign 2+ demo exams → student completes required set → appears rank; incomplete student doesn't; close and freeze snapshot.
6. Responsive test widths 360/768/1440: no overflow, primary flows usable, keyboard navigation acceptable.

**Testing practicality:** Nếu Atlas/test DB chưa cấu hình, unit and build tests vẫn phải chạy; integration/E2E đánh dấu blocked với lý do, cung cấp test DB setup. Có thể sử dụng MongoDB-memory-server cho integration khi tương thích và không đòi Docker, nhưng không ép package download nếu môi trường không thể; tránh test trực tiếp production. Khi thực sự có ENV hợp lệ hãy chạy integration/E2E.

### 13.4. Static quality and safety

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` success; no `any` abusive/TS ignore; no committed secrets; check package dependencies license/vulnerabilities ở mức hợp lý; không tự nâng cấp breaking một cách mù quáng.
- Check accessibility keyboard, labels, focus, semantic HTML. Error paths có giao diện rõ.
- Không claim GDPR/Việt Nam compliance pháp lý hoàn toàn nếu chưa đánh giá; ghi checklist privacy.

---

## 14. CẤU TRÚC THƯ MỤC GỢI Ý

Điều chỉnh cho phù hợp phiên bản framework thực tế nhưng giữ modular boundaries:

```text
examhub-thpt/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (student)/
│   │   ├── (teacher)/
│   │   ├── (admin)/
│   │   └── api/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── subjects/
│   │   ├── topics/
│   │   ├── questions/
│   │   ├── exams/
│   │   ├── attempts/
│   │   ├── grading/
│   │   ├── rankings/
│   │   └── statistics/
│   ├── components/ui/
│   ├── components/layout/
│   ├── lib/mongodb/
│   ├── lib/cloudinary/
│   ├── lib/security/
│   ├── lib/utils/
│   ├── hooks/
│   ├── types/
│   └── styles/
├── scripts/
├── tests/
├── docs/
├── .env.example
├── .gitignore
├── CLAUDE.md
├── package.json
└── README.md
```

Tuyệt đối không import mongoose/models từ Client Components. Chỉ export data DTO đã được kiểm soát từ backend. Dùng alias `@/*` nhất quán.

---

## 15. KẾ HOẠCH PHÁT TRIỂN 7 PHASE VÀ CHECKPOINT

### PHASE 1 — Foundation & UI base

- Xác minh môi trường, khởi tạo Next.js stable App Router TypeScript strict, Tailwind, shadcn/ui, pnpm, lint/test scripts.
- Tạo cấu trúc modules, Mongoose cached connection, env validation fail-fast, error format, design system.
- Tạo layout public/auth/student/teacher/admin và navigation responsive; trang chủ, login/register UI, placeholders **chỉ tại phase này** cho các module chưa tới phase; phải ghi phase status.
- README, `CLAUDE.md`, docs và `.env.example` ban đầu; trang empty-state DEMO.
- Tests nền và build.

**Exit criteria:** server chạy local, giao diện hiển thị mobile/desktop, không có hardcoded secrets, `pnpm build`/typecheck/lint pass. Ghi `docs/PROGRESS.md`.

### PHASE 2 — Authentication, Users & RBAC

- User schema/indexes, register+login username/email + Argon2id, Auth.js credentials, session/logout, protected layouts + API ownership/RBAC, profile, change password, bootstrap admin script, admin create teacher & suspend; secure mail adapter/token interfaces.
- Thêm rate limiting free-friendly (atomic counters + TTL trong MongoDB hoặc lựa chọn không phụ thuộc paid infra), security tests.
- Test: signup, duplicate username/email, wrong password, locked user, privilege escalation denied, admin creates teacher, login by both identifiers.

**Exit criteria:** auth thật hoạt động khi có Mongo env; không fake session.

### PHASE 3 — Subjects, Topics, Question Bank & Cloudinary

- Models/validators/indexes cho subjects/topics/questions/question versions/question keys/media.
- Admin subject/topic UI; teacher CRUD 3 types, LaTeX preview, question ownership/versioning, Cloudinary signed upload; demo seed idempotent, rõ DEMO.
- Tests DTO answer non-leak, version immutability, short answer validation, unauthorized uploads, media metadata.

**Exit criteria:** teacher nhập câu hỏi không cần code hoặc MongoDB editor; dữ liệu vào database thật.

### PHASE 4 — Exam Builder & Review Workflow

- Scoring rules admin config + validation; exam draft builder, add/order questions, duration, sections, preview, teacher submit for review, admin approve/reject/publish/unpublish, immutable published revisions and audit.
- Public exam search/list/details, responsive empty states.

**Exit criteria:** admin có thể tạo/publish một đề DEMO hoàn chỉnh, student chỉ thấy đề public.

### PHASE 5 — Practice, Mock Attempts & Grading

- Practice topic filtering/session, mock start, attempt snapshot, countdown server authority, autosave/debounce/conflict, resume, submit exactly-once, expired finalization, grading 3 types using frozen rule, result release policy, history/profile stats.
- Unit + integration tests đặc biệt cho score/time/concurrency, no answer leakage.

**Exit criteria:** student tự thi full workflow, refresh/resume, timed end, history/result đúng; retake unlimited.

### PHASE 6 — Rankings, Statistics & Admin Campaigns

- Ranking campaign creation/activation/closure, first ranked attempt selection atomic, score average scaled integer, completion filter, timezone, tie-break, public/student leaderboard, admin batch finalization/snapshots, privacy nickname/opt-out.
- Dashboard stats cơ bản, weekly/monthly/yearly filters, edge cases/campaign validation.

**Exit criteria:** demo campaign với 2+ đề và >=3 users có bảng xếp hạng đúng, retakes không đổi rank, snapshot closed stable.

### PHASE 7 — Hardening, E2E & Deployment Documentation

- E2E critical flows, accessibility/responsiveness, security, log redaction, index/query optimization, error handling, Cloudinary and Mongo quota discipline, dependency audit, deployment guides, optional verified email provider integration only when configured.
- Production build; migration/index management; manual smoke test checklist Vercel/Mongo Atlas/Cloudinary; complete README and final acceptance matrix.

**Exit criteria:** runnable MVP, documented missing external configuration if any, final status truthful, demo data removable.

**Đặc biệt:** Không dừng ở Phase 1 nếu có đủ điều kiện tiếp tục. Nếu Claude Code có giới hạn context, `docs/PROGRESS.md` phải có mỗi phase `TODO|IN_PROGRESS|DONE|BLOCKED`, files changed, commands run, test results, unresolved blockers, NEXT ACTION exact. Tránh làm lại từ đầu khi quay lại phiên sau.

---

## 16. QUY TRÌNH PHẢN HỒI CỦA CLAUDE CODE

Ở đầu phiên, báo ngắn:

1. Repository trạng thái hiện tại và các tool được phép dùng.
2. Stack/versions thực tế và khác biệt nếu có với mong muốn.
3. Phase đang bắt đầu; 3–6 việc cụ thể.

Sau đó **thực thi ngay**, dùng công cụ để tạo file/viết code/chạy test; không chỉ gửi lời giải thích dài.

Cuối **mỗi phase** trả theo khung:

- `PHASE X — STATUS: DONE / BLOCKED / PARTIAL`
- Tính năng thực sự đã chạy.
- Danh sách file chính tạo/sửa.
- Lệnh đã chạy và kết quả thực tế (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, E2E nếu có).
- Các rủi ro/cấu hình thiếu, cụ thể user cần làm gì.
- Phase kế tiếp và hành động tiếp theo.

Ở cuối toàn dự án báo:

- Bảng acceptance test PASS/FAIL/NOT VERIFIED.
- URL localhost/câu lệnh chạy nếu thực sự có; deployment URL chỉ khi deploy thật.
- Bảng ENV cần điền và quy trình tạo dịch vụ miễn phí.
- Hướng dẫn tạo admin, seed DEMO, xóa demo an toàn, reset password.
- Giới hạn/chi phí free tier và rủi ro bảo mật chưa xử lý.
- Danh sách việc đề xuất cho v1.1, tách khỏi MVP.

---

## 17. CÁC TÌNH HUỐNG BẮT BUỘC ĐƯỢC GIẢI QUYẾT

1. Một học sinh bấm “Bắt đầu” hai lần gần như cùng lúc: không bị tính hai lượt đầu tiên.
2. Học sinh đăng nhập ở hai tab: không ghi đè câu trả lời cũ mà không phát hiện conflict.
3. Học sinh tắt tab khi đang thi, quay lại sau 5 phút: hiển thị thời gian còn lại tính từ `expiresAt` server.
4. Học sinh tắt tab đến sau hết giờ: khi kiểm tra trạng thái thì finalize câu đã lưu, không cho tiếp tục sửa.
5. Học sinh gửi bài 2 lần: một kết quả duy nhất, không chấm double.
6. Giáo viên sửa câu đã từng dùng trong đề: bài cũ vẫn xem đúng phiên bản.
7. Student gọi API admin trực tiếp bằng Postman: 403.
8. Student cố lấy đáp án từ payload JSON khi thi: không thể.
9. Giáo viên upload file `.svg`, `.html` hay >3MB: bị từ chối rõ ràng.
10. Một kỳ leaderboard có 3 đề, chỉ hoàn thành 2 đề: chưa có hạng.
11. Học sinh làm lần đầu 6 điểm rồi làm lại 10: leaderboard vẫn 6 cho đề đó.
12. Campaign bị đóng: người dùng nộp muộn không được tính rank; kết quả học tập vẫn có thể được lưu theo rule.
13. Kỳ năm bắt đầu/kết thúc qua UTC khác giờ VN: vẫn phân kỳ đúng `Asia/Ho_Chi_Minh`.
14. Thiếu Cloudinary config: câu hỏi không ảnh vẫn thêm được, upload hiện lỗi cấu hình; không làm crash toàn app.
15. Thiếu email provider: không giả gửi email; production không được khuyến nghị mở đăng ký/forgot password nếu chưa có phương án xác minh/khôi phục an toàn.
16. MongoDB/Cloudinary lỗi tạm thời: API trả lỗi có thể hiểu được, không expose URL credentials/secret.
17. Student không cho công khai nickname: không hiện thông tin định danh trong public leaderboard.
18. Danh sách đề rỗng do chưa có đề thật: UI vẫn hữu dụng, đưa hướng dẫn admin thêm DEMO.

---

## 18. HÀNH ĐỘNG NGAY BÂY GIỜ

**Hãy bắt đầu code, không chỉ trả lời bằng kế hoạch.** Kiểm tra workspace, khởi tạo hoặc tiếp tục repository, ghi tài liệu nền và bắt đầu Phase 1. Từng phase phải có code thật và kiểm thử thực tế. Nếu thiếu credential MongoDB Atlas/Cloudinary/Vercel/email, triển khai mọi thứ có thể không cần credential trước và liệt kê rõ cách tôi thêm credentials sau. Khi gặp xung đột kỹ thuật mà không thay đổi phạm vi sản phẩm (ví dụ API framework stable đã đổi), tự tra documentation, chọn giải pháp tương thích, ghi ADR ngắn, làm tiếp. Giữ chi phí ban đầu ở mức free và giải thích các điều khoản có thể hạn chế triển khai công khai.

**Nhắc lại nguyên tắc tối thượng:** bảo mật đáp án, integrity của bài thi và điểm xếp hạng, UX đơn giản, không bịa dữ liệu/secret, không bịa kết quả test, không tự mở dịch vụ trả phí. Tạo ra một MVP có thể vận hành thật chứ không phải giao diện demo.

---

## NGUỒN TÀI LIỆU CHÍNH THỨC ĐỂ TRA CỨU KHI THỰC THI

- Next.js App Router: https://nextjs.org/docs/app
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Auth.js Credentials: https://authjs.dev/getting-started/authentication/credentials
- Mongoose with Next.js: https://mongoosejs.com/docs/nextjs.html
- MongoDB Atlas Free limitations: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- MongoDB Atlas pricing: https://www.mongodb.com/pricing
- Cloudinary signed uploads: https://cloudinary.com/documentation/authentication_signatures
- Cloudinary free plan: https://cloudinary.com/pricing
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Vercel usage restrictions: https://vercel.com/docs/limits/fair-use-guidelines
- Cấu trúc thi THPT (Bộ GDĐT, từ 2025): https://vqa.moet.gov.vn/vi/news/thong-bao/cau-truc-dinh-dang-de-thi-tot-nghiep-thpt-tu-nam-2025-74.html

**Tài liệu chính thức ở thời điểm coding là nguồn để xác minh phiên bản và cách dùng API; các quyết định nghiệp vụ đã khóa trong prompt này vẫn phải được giữ nguyên.**
