# Triển khai & vận hành (free-first)

> Giao diện các dịch vụ có thể thay đổi; tên nút dưới đây đúng tại thời điểm viết. Luôn đọc điều khoản/giới hạn hiện hành.
> **Không cam kết 0 đồng cho lưu lượng lớn hoặc mục đích thương mại.**

## 1. MongoDB Atlas (Free cluster)
1. Đăng ký tại https://www.mongodb.com/cloud/atlas/register → tạo Organization + Project (ví dụ `examhub`).
2. **Create** cluster → chọn gói **Free** (M0), region gần Việt Nam (ví dụ Singapore `ap-southeast-1`) → Create Deployment.
3. **Database Access** → Add New Database User → Password authentication, tạo mật khẩu ngẫu nhiên mạnh; Built-in role: *Read and write to any database* (hoặc tốt hơn: custom role `readWrite` chỉ trên database `examhub`).
4. **Network Access** → Add IP Address:
   - Local: *Add Current IP Address*.
   - Vercel Hobby không có IP egress cố định → thường phải thêm `0.0.0.0/0`. Đây **không phải** cấu hình an toàn tuyệt đối: bù lại bằng mật khẩu mạnh, user quyền tối thiểu, TLS (mặc định bật) và theo dõi Atlas alerts.
5. **Database → Connect → Drivers** → copy connection string `mongodb+srv://...`, thay `<password>` → đặt vào `MONGODB_URI`.
6. Giới hạn M0 cần theo dõi: dung lượng ~512 MB, số kết nối đồng thời, throughput. App dùng pool nhỏ (`MONGODB_MAX_POOL_SIZE=10`) và phân trang mọi danh sách.

## 2. Cloudinary (Free)
1. Đăng ký https://cloudinary.com/users/register_free → tạo product environment.
2. Dashboard → **Product Environment Credentials**: Cloud name, API Key, API Secret → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (secret chỉ đặt ở server env).
3. Không cần upload preset: server ký tham số upload (folder/định dạng/kích thước) theo signed upload.
4. Theo dõi credits/transformations trong Dashboard → Usage.

## 3. Vercel (Hobby — chỉ cá nhân/phi thương mại)
1. Đẩy repository lên GitHub (bạn tự làm; Claude không tự `git push`).
2. https://vercel.com/new → Import repository. Framework: Next.js; Install `pnpm install`; Build `pnpm build`.
3. **Environment Variables** (Production + Preview): `MONGODB_URI`, `MONGODB_DB_NAME`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (= domain Vercel), Cloudinary vars, `MAIL_PROVIDER`, `REQUIRE_EMAIL_VERIFICATION`. `NEXTAUTH_URL` không bắt buộc trên Vercel (tự nhận diện) nhưng nên đặt bằng domain chính thức.
4. Deploy. Sau đó chạy bootstrap admin từ máy local với `MONGODB_URI` production (Phase 2: `pnpm bootstrap:admin`, có xác nhận).
5. Hobby plan dành cho mục đích cá nhân, phi thương mại. Nếu thu phí/thương mại hóa, cần plan phù hợp — xem https://vercel.com/docs/plans/hobby và fair-use guidelines.

## 4. Smoke test production
- [ ] `GET /api/health` → `database: "ok"`, `authSecret: true`.
- [ ] Trang chủ, đăng ký, đăng nhập (username và email), đăng xuất.
- [ ] Học sinh không vào được `/quan-tri` (chuyển tới `/khong-co-quyen`); gọi `/api/admin/users` trả 403.
- [ ] Admin tạo quy tắc tính điểm (xuất bản) và giáo viên; giáo viên tạo câu hỏi có ảnh (kiểm tra upload Cloudinary + thư mục `examhub/questions`), gửi duyệt; admin duyệt.
- [ ] Giáo viên soạn đề, gửi duyệt; admin duyệt → đề xuất hiện ở `/de-thi`.
- [ ] Học sinh làm thi thử: trả lời, tải lại trang (còn câu đã lưu, đồng hồ đúng), nộp, xem điểm/lời giải.
- [ ] Admin tạo kỳ xếp hạng với đề riêng, kích hoạt; học sinh hoàn thành đủ đề thấy thứ hạng; sau khi hết kỳ bấm “Chốt kỳ”.
- [ ] (Nếu đã thử bằng dữ liệu DEMO) `pnpm seed:demo --remove` với `MONGODB_URI` production.

## 5. Sao lưu / khôi phục
- Atlas M0 không có backup tự động. Sao lưu thủ công bằng MongoDB Database Tools:
  `mongodump --uri "<MONGODB_URI>" --db examhub --out ./backup-YYYYMMDD`
- Khôi phục (**cẩn thận — ghi đè dữ liệu khi dùng `--drop`**):
  `mongorestore --uri "<MONGODB_URI>" --nsInclude "examhub.*" ./backup-YYYYMMDD`
- Không commit thư mục backup (chứa dữ liệu cá nhân).
