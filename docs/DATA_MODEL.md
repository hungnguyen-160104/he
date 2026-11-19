# Mô hình dữ liệu (MongoDB / Mongoose)

> Trạng thái: **tất cả collection dưới đây đã được triển khai** (Phase 2–6). Schema chi tiết: `src/modules/*/model.ts`.
> Mọi `_id` là ObjectId. Thời gian lưu UTC. Mọi collection có `createdAt/updatedAt` (timestamps) trừ khi ghi khác.

| Collection | Phase | Ghi chú chính |
|---|---|---|
| `users` | 2 | `usernameNormalized`, `emailNormalized` unique; `passwordHash` `select:false`; `role`, `status`, `displayName`, `grade?`, `leaderboardVisibility` (`PUBLIC`/`HIDDEN`), `emailVerifiedAt?`, `sessionVersion`, `mustChangePassword`, `lastLoginAt?` |
| `rate_limits` | 2 | `key` unique, `count`, `expiresAt` TTL — bộ đếm nguyên tử miễn phí thay Redis |
| `auth_tokens` | 2 | `tokenHash` (SHA-256 của token ngẫu nhiên 32 byte), `purpose`, `userId?`, `expiresAt` TTL, `usedAt?` |
| `audit_logs` | 2 | `actorId`, `action`, `entityType`, `entityId`, `metadata` (đã lọc PII) — index actor/date, entity |
| `subjects` | 3 | `slug` unique, `code`, `allowedQuestionTypes[]`, `examYearsSupported[]`, `isActive`, `sortOrder`, `isDemo` |
| `topics` | 3 | `(subjectId, parentId, slug)` unique; cây phân cấp qua `parentId` |
| `questions` | 3 | `(subjectId,status,type,difficulty)`; `ownerId`, `latestVersionId`, `publishedVersionId?`, `tags`, `isDemo` |
| `question_versions` | 3 | `(questionId, versionNumber)` unique; `content` theo type (stem, options, statements); `media[]`; `isImmutable` |
| `question_keys` | 3 | `questionVersionId` unique; `answerData`, `explanation`, `gradingConfig` — **không bao giờ** vào DTO học sinh trước release |
| `scoring_rules` | 4 | theo môn/năm/version; `typeRules` (pointsByCorrectCount TF…), `maxScore=10`, `roundingPolicy`, `status` (DRAFT/PUBLISHED bất biến) |
| `exams` | 4 | `items[]` (questionVersionId, sectionId, position, points), `scoringRuleId`, `publishStatus`, `resultReleasePolicy`, `revision`, `isDemo` |
| `attempts` | 5 | snapshot `items[]` (itemId, questionVersionId, type, section, maxPoints) + `typeRules` đóng băng; `answers` theo itemId; `revision`; `status` IN_PROGRESS/SUBMITTED/EXPIRED; `scoreScaled` 0..10000; `isFirstRankedAttempt`; `rankEligible` (lượt đầu của STUDENT); `idempotencyKey` unique theo user; `finalizedAt` (= `expiresAt` khi hết giờ) |
| `user_exam_progress` | 5 | `(userId, examId)` unique; `firstAttemptId` chọn nguyên tử bằng upsert |
| `ranking_campaigns` | 6 | môn × `periodType` × `[periodStartAt, periodEndAt)`; `examIds[]`; `status` |
| `ranking_snapshots` | 6 | 1 document / entry (không chạm giới hạn 16 MB); `(campaignId, rank)`, `(campaignId, userId)` unique; bất biến sau khi chốt; lưu `isPublic` + `displayNameSnapshot` |

## Indexes tối thiểu (đặc tả §5.16)
`users.usernameNormalized` (u), `users.emailNormalized` (u); `topics(subjectId,parentId,slug)` (u); `questions(subjectId,status,type,difficulty)`; `question_versions(questionId,versionNumber)` (u); `question_keys.questionVersionId` (u); `exams(subjectId,publishStatus,mode,publishedAt)`; `attempts(userId,examId,startedAt:-1)`, `attempts(userId,status,startedAt:-1)`; `user_exam_progress(userId,examId)` (u); `ranking_campaigns(subjectId,periodType,periodStartAt)`; `ranking_snapshots(campaignId,rank)`; TTL trên `auth_tokens.expiresAt`, `rate_limits.expiresAt`.

## Toàn vẹn tham chiếu
MongoDB không có foreign key: service kiểm tra tham chiếu trước khi ghi; không xóa cứng dữ liệu đã được tham chiếu (soft delete/ARCHIVED).

## Ghi chú thiết kế
- **Lượt đầu tiên:** `user_exam_progress` upsert `$setOnInsert: { firstAttemptId }` trong cùng transaction tạo attempt → chỉ một lượt là "first" kể cả khi bấm bắt đầu đồng thời (đã test 6 request song song).
- **Bất biến:** version câu hỏi `isImmutable` khi được duyệt hoặc được đề dùng; sửa → version mới. Đề PUBLISHED không sửa (nhân bản). Attempt lưu snapshot nên bài cũ luôn hiển thị đúng phiên bản.
- **Attempt không chứa đáp án đúng:** `gradeResult` chỉ có điểm/đúng-sai; đáp án đọc từ `question_keys` khi được phép công bố.
- **Dữ liệu DEMO:** mọi bản ghi seed có `isDemo: true`; `pnpm seed:demo --remove` xóa an toàn (giữ dữ liệu thật).
