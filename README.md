# ExamHub THPT

Website luyện thi tốt nghiệp THPT: ôn tập theo chủ đề, thi thử đếm giờ, bảng xếp hạng theo môn; giáo viên soạn câu hỏi/đề, quản trị viên duyệt.

> Trạng thái phát triển: xem [`docs/PROGRESS.md`](docs/PROGRESS.md). Đặc tả: [`EXAMHUB_THPT_CLAUDE_CODE_MASTER_PROMPT.md`](EXAMHUB_THPT_CLAUDE_CODE_MASTER_PROMPT.md).

## Công nghệ
Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 + shadcn/ui · NextAuth v4 (Credentials) + Argon2id · MongoDB Atlas + Mongoose 9 · Cloudinary · KaTeX · Vitest · Playwright. Chi tiết phiên bản và ADR: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Chạy local
Yêu cầu: Node.js ≥ 20.9 (đã thử 22.14), pnpm 10.

```bash
pnpm install
cp .env.example .env.local     # rồi điền giá trị (xem bên dưới)
pnpm dev                       # http://localhost:3000
```

Không có `MONGODB_URI` ứng dụng vẫn chạy; các chức năng cần dữ liệu báo “Chưa cấu hình cơ sở dữ liệu”. Kiểm tra cấu hình: `GET http://localhost:3000/api/health`.

### Biến môi trường
| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `MONGODB_URI` | Có (để dùng dữ liệu) | Connection string MongoDB Atlas |
| `MONGODB_DB_NAME` | Không | Mặc định `examhub` |
| `AUTH_SECRET` | Có ở production | Chuỗi ngẫu nhiên ≥ 32 ký tự: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` | Nên có | URL gốc của app |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Không | Upload ảnh câu hỏi |
| `CLOUDINARY_UPLOAD_FOLDER` | Không | Mặc định `examhub` |
| `MAIL_PROVIDER` | Không | `none` (mặc định) / `console` (chỉ dev) / `resend` |
| `MAIL_FROM`, `RESEND_API_KEY` | Khi dùng resend | |
| `REQUIRE_EMAIL_VERIFICATION` | Không | Mặc định `true` ở production, `false` ở dev |

Hướng dẫn tạo MongoDB Atlas Free, Cloudinary Free và deploy Vercel từng bước: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Lệnh
| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy dev server |
| `pnpm build` / `pnpm start` | Build và chạy production |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit + integration (MongoDB in-memory, không cần Docker) |
| `pnpm test:e2e` | Playwright E2E (chạy `pnpm build` trước; lần đầu: `pnpm exec playwright install chromium`) |
| `pnpm check` | typecheck + lint + test + build |
| `pnpm bootstrap:admin` | Tạo quản trị viên đầu tiên (xem bên dưới) |
| `pnpm seed:demo` | Tạo dữ liệu DEMO (idempotent) — `--remove` để xóa, `--dry-run` để xem trước |

## Chạy local không cần Atlas (MongoDB cục bộ)
```bash
pnpm db:local   # terminal 1 — MongoDB lưu bền tại ./.data/mongodb (cổng 27018, replica set rs0)
pnpm dev        # terminal 2 — http://localhost:3000
```
`.env.local`: `MONGODB_URI=mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true`. Khi chuyển sang Atlas chỉ cần thay biến này.

**Chế độ thử nghiệm** `UNLIMITED_MODE=true` (đang bật trong `.env.local`): đề thi thử không đếm giờ, không giới hạn số bài làm dở, tắt rate limit. Đặt `false` để dùng giới hạn thật. Biến này **luôn bị bỏ qua ở production** (`pnpm build`/`start`, Vercel).

Tài khoản quản trị tạm thời cho môi trường local: **admin / admin123** (tạo bằng `--allow-weak-password`, tùy chọn này bị từ chối với database không phải local hoặc production). Hãy đổi mật khẩu ở trang Hồ sơ trước khi dùng thật.

## Dữ liệu DEMO
```bash
pnpm seed:demo                 # 11 môn + chủ đề; 3 đề thi thử đầy đủ (Toán, Vật lí, Hóa học) kèm lời giải
pnpm seed:demo --remove        # xóa toàn bộ dữ liệu DEMO và các lượt làm bài trên nội dung DEMO
pnpm seed:demo --profile e2e   # bộ dữ liệu tổng hợp dùng cho kiểm thử E2E (6 đề + kỳ xếp hạng)
```
Ba đề mặc định mô phỏng cấu trúc đề thi tốt nghiệp THPT từ năm 2025: Toán 22 câu/90 phút (12 trắc nghiệm, 4 đúng/sai, 6 trả lời ngắn × 0,5 điểm); Vật lí và Hóa học 28 câu/50 phút (18 trắc nghiệm, 4 đúng/sai, 6 trả lời ngắn × 0,25 điểm); mỗi đề tối đa 10 điểm. Nội dung câu hỏi nằm trong `scripts/demo-content/thpt-2025.ts` (do hệ thống biên soạn, không phải đề chính thức).
- Mọi bản ghi DEMO có `isDemo: true` và nhãn **[DEMO]** — là câu hỏi giả lập, **không phải đề thi chính thức**.
- Không bao giờ sửa/xóa dữ liệu thật: môn có slug trùng với môn thật sẽ được bỏ qua; khi xóa, môn DEMO đang được dữ liệu thật tham chiếu được giữ lại.
- Nội dung DEMO thuộc tài khoản `demo_giaovien` (mật khẩu ngẫu nhiên không công bố, không đăng nhập được).
- Khi đã nạp đề thật: chạy `pnpm seed:demo --remove`.

## Sử dụng nhanh
| Vai trò | Việc chính | Trang |
|---|---|---|
| Học sinh | Đăng ký, luyện tập theo chủ đề, thi thử có giờ, xem kết quả/lời giải, lịch sử, bảng xếp hạng | `/dashboard`, `/luyen-tap`, `/de-thi`, `/lich-su`, `/bang-xep-hang`, `/ho-so` |
| Giáo viên | Soạn câu hỏi 3 dạng (LaTeX, ảnh), gửi duyệt; soạn đề từ câu đã duyệt, gửi duyệt; nhân bản đề | `/giao-vien`, `/giao-vien/cau-hoi`, `/giao-vien/de-thi` |
| Quản trị | Tạo GV, khóa/mở, đổi vai trò, cấp mật khẩu tạm; môn/chủ đề; quy tắc tính điểm; duyệt câu hỏi/đề; kỳ xếp hạng (tạo → kích hoạt → chốt); nhật ký | `/quan-tri/**` |

Quy trình chuẩn: **Admin** tạo quy tắc tính điểm (xuất bản) → **GV** soạn câu hỏi, gửi duyệt → **Admin** duyệt câu hỏi → **GV** soạn đề từ câu đã duyệt, gửi duyệt → **Admin** duyệt & xuất bản → (tuỳ chọn) **Admin** tạo kỳ xếp hạng với đề **riêng** cho kỳ, kích hoạt; hết kỳ bấm **Chốt kỳ**.

## Tạo quản trị viên đầu tiên
```bash
pnpm bootstrap:admin --username admin --email admin@vidu.vn --display-name "Quản trị"
# mật khẩu được hỏi ẩn; hoặc đặt ADMIN_PASSWORD trong môi trường (không lưu vào file)
```
- Idempotent: nếu admin đã tồn tại thì không thay đổi; tài khoản thường chỉ được nâng quyền khi thêm `--promote`.
- Database không phải localhost (ví dụ Atlas) phải gõ `XAC NHAN` hoặc thêm `--yes`.

## Quên mật khẩu khi chưa có email
Quản trị viên vào **Quản trị → Người dùng → ⋯ → Cấp mật khẩu tạm thời**, gửi mật khẩu cho người dùng qua kênh an toàn; người dùng buộc phải đổi ở lần đăng nhập kế tiếp.

## Giới hạn free tier
Vercel Hobby chỉ dành cho mục đích cá nhân, phi thương mại. MongoDB Atlas M0 ~512 MB và giới hạn kết nối. Cloudinary Free giới hạn credits. Không cam kết chi phí 0 đồng khi lưu lượng lớn hoặc thương mại hóa.
