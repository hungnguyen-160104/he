# Kiến trúc — ExamHub THPT

## 1. Tổng quan

Serverless modular monolith: một codebase Next.js (App Router) cho cả UI và API.

```
Browser (mobile/desktop)
  └─► Next.js 16 (Vercel Serverless, Node.js runtime)
        ├─ Server Components / pages (src/app)
        ├─ Route Handlers  (src/app/api/**)  → apiHandler(): origin check, Zod, error map, no-store
        └─ Domain modules  (src/modules/<domain>/service → repository → model)
              └─► MongoDB Atlas (Mongoose, pool nhỏ, cached connection)
Browser ──(signed upload)──► Cloudinary   (server chỉ ký; secret không rời server)
```

Không có Express/NestJS, worker nền, cron trả phí hay WebSocket.

## 2. Phiên bản thực tế (đã cài, ghi lại ngày 2026-11-19)

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | 22.14.0 (local) | `engines: >=20.9.0` |
| pnpm | 10.18.2 | lockfile `pnpm-lock.yaml` |
| next | 16.4.6 | App Router, Turbopack mặc định |
| react / react-dom | 19.3.0 | |
| typescript | 5.9.3 | strict + `noUncheckedIndexedAccess` |
| next-auth | 4.24.15 | **stable** Auth.js line (ADR-003) |
| mongoose | 9.12.2 | |
| @node-rs/argon2 | 2.2.2 | Argon2id, prebuilt N-API (không cần node-gyp) |
| zod | 4.6.7 | |
| tailwindcss | 4.3.3 | qua `@tailwindcss/turbopack` |
| shadcn (CLI) / radix-ui | 4.23.0 / 1.8.x | style new-york, base Radix |
| react-hook-form / @hookform/resolvers | 7.92 / 7.0.7 | |
| katex | 0.19.1 | |
| decimal.js | 10.6.0 | |
| cloudinary | 2.11.0 | |
| date-fns / @date-fns/tz | 4.4 / 1.5 | múi giờ `Asia/Ho_Chi_Minh` |
| vitest | 5.1.1 | |
| @playwright/test | 1.65.1 | Chromium v1255 |
| mongodb-memory-server | 11.3.0 | integration/E2E không cần Docker |

## 3. Cấu trúc thư mục

```
src/
  app/
    (public)/   trang chủ, môn học, đề thi, bảng xếp hạng, chính sách
    (auth)/     đăng nhập, đăng ký, quên/đặt lại mật khẩu
    (student)/  dashboard, luyện tập, làm bài, kết quả, lịch sử, hồ sơ
    (teacher)/  /giao-vien/**
    (admin)/    /quan-tri/**
    api/        Route Handlers
  modules/<domain>/   auth, users, subjects, topics, questions, exams, attempts, grading, rankings, statistics
  components/{ui,layout,common,forms,auth}
  lib/{api,mongodb,security,validation,utils,auth,cloudinary}
scripts/   seed/bootstrap/e2e harness
tests/{unit,integration,e2e}
docs/
```

## 4. Quyết định kiến trúc (ADR)

### ADR-001 — Next.js 16 App Router, một codebase
Theo đặc tả. Route Handlers chỉ xác thực, validate, gọi service, format response.

### ADR-002 — Tắt Cache Components (`cacheComponents: false`)
`create-next-app@16.4.6` bật Cache Components mặc định. Với Cache Components, mọi truy cập cookie/DB phải nằm trong `<Suspense>` hoặc `"use cache"`, nếu không build lỗi. Gần như mọi trang của ExamHub là theo người dùng (phiên, lượt thi, kết quả), nên mô hình động truyền thống đơn giản và an toàn hơn (không có nguy cơ cache nhầm dữ liệu cá nhân). Dữ liệu công khai (môn/đề đã xuất bản) dùng `unstable_cache`/revalidate ngắn có kiểm soát; route nhạy cảm `Cache-Control: private, no-store`.
**Hệ quả:** Next.js tài liệu cho biết Cache Components sẽ bật mặc định ở major kế tiếp (17). Khi nâng cấp cần migrate theo `docs/01-app/02-guides/migrating-to-cache-components.md`.

### ADR-003 — NextAuth v4.24 (Auth.js stable) thay vì Auth.js v5
Tại thời điểm build, `next-auth@5` vẫn là `beta` (5.0.0-beta.32); bản `latest` là 4.24.15, có peerDependency chính thức `next ^16`. Đặc tả yêu cầu tránh beta khi có bản stable. Dùng Credentials provider + JWT session cookie (HttpOnly, Secure ở HTTPS, SameSite=Lax). Biến `AUTH_SECRET` được truyền vào `secret` (chấp nhận cả `NEXTAUTH_SECRET`). Role/status/sessionVersion được kiểm tra lại từ DB ở thao tác nhạy cảm (tránh JWT stale).

### ADR-004 — CSP tĩnh không nonce
Nonce buộc mọi trang render động qua proxy. CSP tĩnh trong `next.config.ts`: `script-src 'self' 'unsafe-inline'` (Next bootstrap), `style-src 'unsafe-inline'` (KaTeX), ảnh chỉ từ self/data/blob/res.cloudinary.com, `frame-ancestors 'none'`. Chống XSS chủ yếu nhờ không bao giờ render HTML thô do người dùng nhập (React escape + renderer KaTeX an toàn).

### ADR-005 — CSRF cho API cookie-auth
Mutation bị từ chối nếu `Origin` khác host hoặc `Sec-Fetch-Site: cross-site`; body bắt buộc `application/json` (form HTML không thể giả mạo). Các endpoint của NextAuth có CSRF token riêng.

### ADR-006 — Không bật `mongoose.set("sanitizeFilter")`
Nó bọc cả filter `$in`/`$gte` hợp lệ của chính ứng dụng vào `$eq`. Thay vào đó: mọi input không tin cậy đi qua Zod (chỉ kiểu nguyên thủy) và `assertNoMongoOperators()` cho JSON tự do; `strictQuery` bật.

### ADR-007 — Package `cn`
shadcn CLI 4.x sinh `import { cn } from "cn"` — package chính thức do shadcn duy trì (MIT, repo shadcn-ui/cn), thay thế clsx + tailwind-merge. Giữ nguyên, re-export qua `@/lib/utils`.

### ADR-008 — Cache catalog công khai, hết hạn ngay khi admin thay đổi
`unstable_cache` (60–120 s) cho môn/chủ đề/đề đã xuất bản (metadata). Route Handler của admin gọi `revalidateTag("subjects"|"exams", { expire: 0 })` (Next 16: không phục vụ dữ liệu cũ sau khi gỡ/duyệt đề). Bảng xếp hạng đang diễn ra tính on-demand; kỳ đã chốt đọc snapshot bất biến.

### ADR-009 — Không cron: đối soát lượt hết giờ theo yêu cầu
Lượt quá hạn được chốt khi người dùng mở lại/lưu/nộp, khi xem lịch sử (≤20 lượt), qua `POST /api/admin/attempts/reconcile` (≤100/lần) và khi admin chốt kỳ (lặp theo lô tới khi xong). Phù hợp giới hạn thời gian serverless của Vercel Hobby.

### ADR-010 — Một transaction cho "lượt đầu tiên"
`user_exam_progress` (unique `userId+examId`) upsert `$setOnInsert` cùng transaction tạo attempt. Atlas M0 là replica set nên hỗ trợ transaction; test dùng `MongoMemoryReplSet`.

## 5. Kết nối MongoDB
`src/lib/mongodb/connection.ts`: cache promise trên `globalThis` (dev HMR) và module scope (serverless warm instance); `maxPoolSize` mặc định 10 (env), `minPoolSize 0`, `serverSelectionTimeoutMS 8s`, `bufferCommands false` (lỗi nhanh thay vì treo), lỗi kết nối → `DB_UNAVAILABLE 503` không lộ URI.

## 6. Môi trường
`src/lib/env.ts` validate bằng Zod; `src/instrumentation.ts` gọi khi server khởi động: biến sai định dạng → production dừng ngay; thiếu tích hợp tùy chọn → app vẫn chạy và hiển thị “Chưa cấu hình …”.
