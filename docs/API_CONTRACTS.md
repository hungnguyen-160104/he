# Hợp đồng API

## Quy ước chung
- Envelope thành công: `{ "success": true, "data": ..., "meta"?: { page, limit, total, totalPages } }`
- Envelope lỗi: `{ "success": false, "error": { "code", "message", "details"? }, "requestId" }`
- Mã HTTP: 400 BAD_REQUEST · 401 UNAUTHORIZED · 403 FORBIDDEN · 404 NOT_FOUND · 409 CONFLICT/REVISION_CONFLICT · 413 PAYLOAD_TOO_LARGE · 422 VALIDATION_ERROR · 429 RATE_LIMITED (kèm `Retry-After`) · 503 CONFIG_MISSING/DB_UNAVAILABLE · 500 INTERNAL_ERROR (không stack trace).
- `VALIDATION_ERROR.details` = `{ formErrors: string[], fieldErrors: Record<string,string[]> }` (Zod flatten).
- Mặc định `Cache-Control: private, no-store`. Header `X-Request-Id` trên mọi response.
- Mutation: bắt buộc `Content-Type: application/json`, body ≤ 64 KB (trừ khi ghi khác), `Origin` phải cùng host.
- Phân trang: `?page=1&limit=20` (limit ≤ 100). ID không hợp lệ → 400/404 có kiểm soát.

## Đã triển khai

### `GET /api/health` — công khai
Trạng thái sống + cấu hình dạng boolean.
```json
{ "success": true, "data": { "status": "ok", "database": "ok|unavailable|not_configured",
  "config": { "database": true, "authSecret": true, "cloudinary": false, "mail": false, "mailProvider": "none", "requireEmailVerification": false },
  "time": "ISO" } }
```

### Auth (Phase 2)
| Method & path | Auth | Body (Zod) | Response | Lỗi chính |
|---|---|---|---|---|
| `POST /api/auth/register` | khách | `registerSchema` strict: `username, email, password, confirmPassword, acceptTerms:true` (≤8 KB) | 201 `{ requiresEmailVerification }` | 409 trùng username (hoặc email khi không bật xác minh), 422, 429 (10/giờ/IP), 503 đăng ký đóng |
| `GET/POST /api/auth/[...nextauth]` | — | NextAuth v4 (Credentials `identifier`+`password`, CSRF token riêng) | cookie phiên JWT | `error`: `CredentialsSignin` / `ACCOUNT_SUSPENDED` / `EMAIL_NOT_VERIFIED` / `RATE_LIMITED` / `CONFIG_MISSING` / `DB_UNAVAILABLE` |
| `POST /api/auth/change-password` | đăng nhập (cho phép khi `mustChangePassword`) | `currentPassword, newPassword, confirmPassword` | `{ changed, reloginRequired }` | 422 sai mật khẩu hiện tại/yếu, 429 |
| `POST /api/auth/forgot-password` | khách | `{ email }` | 202 `{ accepted:true }` (giống nhau dù email có tồn tại) | 503 chưa cấu hình mail, 429 |
| `POST /api/auth/reset-password` | khách | `token, newPassword, confirmPassword` | `{ reset:true }` | 422 token sai/hết hạn/đã dùng |
| `POST /api/auth/verify-email` | khách | `{ token }` | `{ verified:true }` | 422 |
| `GET /api/me` | đăng nhập | — | `ProfileDto` (không có hash/sessionVersion) | 401 |
| `PATCH /api/me` | đăng nhập | strict `{ displayName?, grade?: 10/11/12/null, leaderboardVisibility?: PUBLIC/HIDDEN }` | `ProfileDto` | 422 (vd. gửi `role`) |

### Admin users (Phase 2) — chỉ `ADMIN`, giới hạn 120 thao tác/phút
| Method & path | Body / query | Response | Ghi chú |
|---|---|---|---|
| `GET /api/admin/users` | `?role&status&q&page&limit` | `AdminUserRowDto[]` + meta | |
| `GET /api/admin/teachers` | như trên | danh sách giáo viên | |
| `POST /api/admin/teachers` | `{ username, email, displayName }` | 201 `{ user, temporaryPassword }` | mật khẩu tạm hiển thị 1 lần, `mustChangePassword=true`; audit `TEACHER_CREATED` |
| `PATCH /api/admin/users/:id/status` | `{ status: ACTIVE/SUSPENDED }` | `AdminUserRowDto` | khóa → `sessionVersion++` (thu hồi phiên); không tự khóa; không khóa admin cuối |
| `PATCH /api/admin/users/:id/role` | `{ role }` | `AdminUserRowDto` | không tự đổi; không hạ admin cuối; audit |
| `POST /api/admin/users/:id/reset-password` | — | `{ temporaryPassword }` | cho môi trường không có email; audit |
| `GET /api/admin/audit-logs` | `?page&limit&action` | `AuditLogDto[]` + meta | |

### Môn học & chủ đề (Phase 3)
| Method & path | Auth | Ghi chú |
|---|---|---|
| `GET /api/subjects` | công khai | môn đang hoạt động; `Cache-Control: public, max-age=60` |
| `GET /api/subjects/:id/topics` | công khai | chủ đề đang hoạt động |
| `GET /api/admin/subjects` | TEACHER/ADMIN | tất cả môn |
| `POST /api/admin/subjects`, `PATCH/DELETE /api/admin/subjects/:id` | ADMIN | slug/mã unique (409); DELETE bị chặn (422) khi đã có chủ đề/câu hỏi/đề/quy tắc |
| `GET /api/admin/subjects/:id/topics` | TEACHER/ADMIN | gồm chủ đề đã tắt |
| `POST /api/admin/topics`, `PATCH/DELETE /api/admin/topics/:id` | ADMIN | tối đa 2 cấp; DELETE bị chặn khi có chủ đề con/câu hỏi |

### Ngân hàng câu hỏi (Phase 3)
Payload `{ meta: { subjectId, topicIds[], difficulty, tags[] }, body: { type, content, key, explanation } }` — Zod discriminated union (`src/modules/questions/validation.ts`).

| Method & path | Auth | Ghi chú |
|---|---|---|
| `GET /api/manage/questions?subjectId&type&difficulty&status&q&mine&page&limit` | TEACHER (của mình) / ADMIN (tất cả) | |
| `POST /api/manage/questions` | TEACHER/ADMIN | 201 `{ id }`; 422 dạng câu không thuộc môn / chủ đề khác môn; 503 có ảnh khi chưa cấu hình Cloudinary |
| `GET /api/manage/questions/:id` | chủ sở hữu / ADMIN | `QuestionEditorDto` có đáp án (chỉ editor); `ETag` theo revision |
| `PATCH /api/manage/questions/:id` | chủ sở hữu / ADMIN | body + `revision`; version bất biến → tự tạo version mới; 409 khi revision cũ |
| `POST /api/manage/questions/:id/versions` | chủ sở hữu / ADMIN | ép tạo version mới |
| `DELETE /api/manage/questions/:id` | chủ sở hữu / ADMIN | lưu trữ (soft delete) |
| `POST /api/manage/questions/:id/request-review` | chủ sở hữu / ADMIN | DRAFT/REJECTED → IN_REVIEW |
| `POST /api/admin/questions/:id/approve`, `/reject {reason}` | ADMIN | approve: `publishedVersionId` = bản mới nhất, version bất biến |
| `POST /api/manage/uploads/signature` | TEACHER/ADMIN | tham số ký Cloudinary (folder/định dạng/timestamp do server chọn), **không trả API secret**; 503 khi chưa cấu hình; rate limit |
| `POST /api/manage/uploads/verify {publicId}` | TEACHER/ADMIN | kiểm tra asset qua Admin API (folder, JPG/PNG/WebP, ≤3 MB); asset sai bị xóa |

### Đề thi & duyệt (Phase 4)
| Method & path | Auth | Ghi chú |
|---|---|---|
| `GET/POST /api/admin/scoring-rules`, `POST /api/admin/scoring-rules/:id/publish` | GET: TEACHER (chỉ bản đã xuất bản) / ADMIN; ghi: ADMIN | bản PUBLISHED bất biến; bản mới = version + 1 |
| `GET/POST /api/manage/exams` | TEACHER/ADMIN | `examDraftSchema`; chỉ câu hỏi đã duyệt cùng môn |
| `GET/PATCH /api/manage/exams/:id` | chủ sở hữu / ADMIN | PATCH `{ revision, input }`, chỉ khi DRAFT/REJECTED |
| `POST /api/manage/exams/:id/submit-review`, `/clone` | chủ sở hữu / ADMIN | validate đầy đủ trước khi gửi |
| `GET /api/manage/question-picker?subjectId&type&difficulty&topicId&q` | TEACHER/ADMIN | câu đã duyệt (không kèm đáp án) |
| `GET /api/admin/reviews?kind=exams` hoặc `kind=questions` | ADMIN | hàng đợi duyệt |
| `GET /api/admin/exams/:id` | ADMIN | nội dung + đáp án (ngữ cảnh duyệt) |
| `POST /api/admin/exams/:id/approve`, `/reject {reason}`, `/unpublish`, `/release-results` | ADMIN | unpublish bị chặn khi đề thuộc kỳ ACTIVE |
| `GET /api/exams?subjectId&mode&difficulty&year&q&page&limit` | công khai | chỉ PUBLISHED, metadata |
| `GET /api/exams/:id` | công khai | metadata + cấu trúc điểm; **không có câu hỏi/đáp án** |

### Làm bài (Phase 5) — userId luôn lấy từ session
| Method & path | Ghi chú |
|---|---|
| `GET /api/practice/options` | môn + số câu đã duyệt theo dạng |
| `POST /api/practice/sessions {subjectId, topicIds, difficulty, types, count 5–40, idempotencyKey}` | 201 `{ attemptId, requested, actual }` — báo đúng số câu thực có; không xếp hạng |
| `POST /api/attempts {examId, idempotencyKey}` | 201 tạo mới, 200 `resumed` (cùng key hoặc đang có lượt mở); đề chưa xuất bản → 404; tối đa 5 lượt mở |
| `GET /api/attempts?subjectId&mode&status` | lịch sử của tôi (`status` = `IN_PROGRESS` hoặc `DONE`) |
| `GET /api/attempts/:id` | nội dung + câu đã lưu + `serverTime`/`expiresAt`; quá hạn → tự chốt; của người khác → 404 |
| `PATCH /api/attempts/:id/answers {revision, answers: {itemId: response hoặc null}, marked?}` | 409 `REVISION_CONFLICT` (kèm bản server), 409 `ATTEMPT_EXPIRED`, 409 `ATTEMPT_CLOSED`, 400 câu không thuộc bài, 422 sai định dạng |
| `POST /api/attempts/:id/submit` | chốt đúng 1 lần; gọi lại trả cùng kết quả |
| `GET /api/attempts/:id/result` | điểm; chi tiết/đáp án/lời giải **chỉ khi** chính sách cho phép (`released`, `withheldReason`, `releaseAt`) |
| `GET /api/me/stats`, `GET /api/me/ranking-progress` | thống kê cá nhân |
| `POST /api/admin/attempts/reconcile` | ADMIN: chốt tối đa 100 lượt quá hạn mỗi lần |

Response theo dạng câu: SINGLE_CHOICE `{ optionId: "A".."D" | null }` · TRUE_FALSE `{ values: { a?, b?, c?, d?: boolean | null } }` · SHORT_ANSWER `{ text: string ≤ 100 }`.

### Xếp hạng (Phase 6)
| Method & path | Auth | Ghi chú |
|---|---|---|
| `GET /api/rankings?subjectId&periodType&campaignId&limit` (10/50/100) | công khai (+ vị trí của tôi nếu đăng nhập) | chỉ biệt danh hoặc "Học sinh ẩn danh"; không email/userId |
| `GET/POST /api/admin/ranking-campaigns` | ADMIN | `{ title, subjectId, periodType, referenceDate (ISO có offset), examIds[] }` → ranh giới kỳ tính theo giờ Việt Nam |
| `GET /api/admin/ranking-campaigns/preview?periodType&date` | ADMIN | xem trước ranh giới kỳ |
| `GET /api/admin/ranking-campaigns/:id` | ADMIN | chi tiết, kiểm tra kích hoạt (problems/warnings), độ hoàn thành |
| `POST /api/admin/ranking-campaigns/:id/activate` | ADMIN | 422 kèm `details.problems` khi không hợp lệ/không công bằng |
| `POST /api/admin/ranking-campaigns/:id/finalize` | ADMIN | sau khi kỳ kết thúc; gọi lặp tới khi `done: true` (chốt theo lô) |
