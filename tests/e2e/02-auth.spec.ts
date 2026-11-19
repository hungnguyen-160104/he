import { expect, test } from "@playwright/test";
import { ADMIN, login, logout, register, uniq } from "./helpers";

const STUDENT_PASSWORD = "Hoc tap cham chi 2026";

test.describe("Phase 2 — authentication, users & RBAC", () => {
  test("register student → auto login → logout → login by username → logout → login by email", async ({ page }) => {
    const u = `hs_${uniq()}`;
    await register(page, u, `${u}@example.com`, STUDENT_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("button", { name: "Tài khoản" })).toBeVisible();
    await logout(page);

    await login(page, u.toUpperCase(), STUDENT_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await logout(page);

    await login(page, `${u}@EXAMPLE.com`, STUDENT_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("duplicate username shows a field error", async ({ page }) => {
    const u = `dup_${uniq()}`;
    await register(page, u, `${u}@example.com`, STUDENT_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await logout(page);
    await register(page, u, `khac_${u}@example.com`, STUDENT_PASSWORD);
    await expect(page.getByText("Tên đăng nhập đã được sử dụng").first()).toBeVisible();
  });

  test("wrong password shows a generic error", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByRole("textbox", { name: "Tên đăng nhập hoặc email" }).fill(ADMIN.username);
    await page.getByRole("textbox", { name: "Mật khẩu" }).fill("sai mat khau 999");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Tên đăng nhập/email hoặc mật khẩu không đúng.")).toBeVisible();
  });

  test("guests are redirected to login with callbackUrl; APIs return 401", async ({ page, request }) => {
    await page.goto("/lich-su");
    await expect(page).toHaveURL(/\/dang-nhap\?callbackUrl=%2Flich-su/);
    expect((await request.get("/api/me")).status()).toBe(401);
    expect((await request.get("/api/admin/users")).status()).toBe(401);
  });

  test("student cannot reach admin pages or admin APIs (403)", async ({ page }) => {
    const u = `hs_${uniq()}`;
    await register(page, u, `${u}@example.com`, STUDENT_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/quan-tri");
    await expect(page).toHaveURL(/\/khong-co-quyen$/);
    const res = await page.request.get("/api/admin/users");
    expect(res.status()).toBe(403);
    const create = await page.request.post("/api/admin/teachers", { data: { username: "hack_gv", email: "hack@example.com", displayName: "Hack" } });
    expect(create.status()).toBe(403);
    // Mass assignment attempt on own profile
    const patch = await page.request.patch("/api/me", { data: { role: "ADMIN" } });
    expect(patch.status()).toBe(422);
  });

  test("cross-origin mutation is rejected", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  test("admin creates teacher → teacher must change temp password → reaches teacher area", async ({ page, browser }) => {
    await login(page, ADMIN.username, ADMIN.password);
    await expect(page).toHaveURL(/\/quan-tri$/);
    await page.goto("/quan-tri/nguoi-dung");
    const t = `gv_${uniq()}`;
    await page.getByRole("button", { name: "Tạo giáo viên" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Tên đăng nhập" }).fill(t);
    await dialog.getByRole("textbox", { name: "Email" }).fill(`${t}@example.com`);
    await dialog.getByRole("textbox", { name: "Tên hiển thị" }).fill("Thầy Kiểm Thử");
    await dialog.getByRole("button", { name: "Tạo tài khoản" }).click();
    const tempPassword = (await page.getByTestId("temp-password").textContent())?.trim() ?? "";
    expect(tempPassword.length).toBeGreaterThan(10);
    await page.getByRole("button", { name: "Đã lưu mật khẩu" }).click();
    await expect(page.getByText(`@${t}`)).toBeVisible();

    const ctx = await browser.newContext();
    const tp = await ctx.newPage();
    await login(tp, t, tempPassword);
    await expect(tp).toHaveURL(/\/ho-so\?doi-mat-khau=1$/);
    await tp.goto("/giao-vien");
    await expect(tp).toHaveURL(/\/ho-so\?doi-mat-khau=1$/);
    const newPw = "Giao vien moi 2026";
    await tp.getByRole("textbox", { name: "Mật khẩu hiện tại" }).fill(tempPassword);
    await tp.getByRole("textbox", { name: "Mật khẩu mới", exact: true }).fill(newPw);
    await tp.getByRole("textbox", { name: "Nhập lại mật khẩu mới" }).fill(newPw);
    await tp.getByRole("button", { name: "Đổi mật khẩu" }).click();
    await expect(tp).toHaveURL(/\/dang-nhap\?notice=password_changed/);
    await login(tp, t, newPw);
    await expect(tp).toHaveURL(/\/giao-vien$/);
    await ctx.close();
  });

  test("admin locks a student → existing session is revoked immediately", async ({ page, browser }) => {
    const u = `lock_${uniq()}`;
    const sctx = await browser.newContext();
    const sp = await sctx.newPage();
    await register(sp, u, `${u}@example.com`, STUDENT_PASSWORD);
    await expect(sp).toHaveURL(/\/dashboard$/);
    expect((await sp.request.get("/api/me")).status()).toBe(200);

    await login(page, ADMIN.username, ADMIN.password);
    await page.goto("/quan-tri/nguoi-dung");
    await page.getByRole("textbox", { name: /Tìm theo tên đăng nhập/ }).fill(u);
    await page.getByRole("button", { name: "Tìm kiếm" }).click();
    await page.getByRole("button", { name: `Thao tác với ${u}` }).click();
    await page.getByRole("menuitem", { name: "Khóa tài khoản" }).click();
    await page.getByRole("button", { name: "Xác nhận" }).click();
    await expect(page.getByText("Đã khóa")).toBeVisible();

    expect((await sp.request.get("/api/me")).status()).toBe(401);
    await sp.goto("/dashboard");
    await expect(sp).toHaveURL(/\/dang-nhap/);
    await sp.getByRole("textbox", { name: "Tên đăng nhập hoặc email" }).fill(u);
    await sp.getByRole("textbox", { name: "Mật khẩu" }).fill(STUDENT_PASSWORD);
    await sp.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(sp.getByText("Tài khoản đang bị khóa")).toBeVisible();
    await sctx.close();
  });

  test("profile: update nickname and hide from leaderboard", async ({ page }) => {
    const u = `prof_${uniq()}`;
    await register(page, u, `${u}@example.com`, STUDENT_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/ho-so");
    await page.getByRole("textbox", { name: /Biệt danh/ }).fill("Bạn Nhỏ Chăm Học");
    await page.getByRole("checkbox", { name: /Hiển thị biệt danh/ }).uncheck();
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đã lưu hồ sơ.")).toBeVisible();
    const me = await (await page.request.get("/api/me")).json();
    expect(me.data).toMatchObject({ displayName: "Bạn Nhỏ Chăm Học", leaderboardVisibility: "HIDDEN" });
    expect(JSON.stringify(me)).not.toContain("passwordHash");
  });

  test("admin audit log lists security events", async ({ page }) => {
    await login(page, ADMIN.username, ADMIN.password);
    await page.goto("/quan-tri/nhat-ky");
    // Earlier tests in this run created a teacher and locked a student.
    await expect(page.getByRole("cell", { name: "Tạo giáo viên" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Đổi trạng thái tài khoản" }).first()).toBeVisible();
  });
});
