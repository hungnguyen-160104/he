import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [360, 768, 1440];
const PUBLIC_PAGES = ["/", "/mon-hoc", "/de-thi", "/bang-xep-hang", "/dang-nhap", "/dang-ky", "/quen-mat-khau", "/chinh-sach-rieng-tu", "/dieu-khoan"];

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

test.describe("Phase 1 — foundation & responsive layout", () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PUBLIC_PAGES) {
        const res = await page.goto(path);
        expect(res?.status(), path).toBe(200);
        expect(await hasHorizontalOverflow(page), `overflow on ${path} @${width}`).toBe(false);
      }
    });
  }

  test("home page shows hero and CTA in Vietnamese", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Luyện thi THPT hiệu quả" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bắt đầu luyện tập" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  test("mobile menu opens and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Mở menu" }).click();
    await page.getByRole("navigation", { name: "Điều hướng di động" }).getByRole("link", { name: "Đề thi" }).click();
    await expect(page).toHaveURL(/\/de-thi$/);
  });

  test("login form shows Vietnamese validation errors", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Vui lòng nhập tên đăng nhập hoặc email")).toBeVisible();
    await expect(page.getByText("Vui lòng nhập mật khẩu")).toBeVisible();
  });

  test("register form validates password confirmation and terms", async ({ page }) => {
    await page.goto("/dang-ky");
    await page.getByLabel("Tên đăng nhập").fill("hocsinh_e2e");
    await page.getByLabel("Email").fill("e2e@example.com");
    await page.getByRole("textbox", { name: "Mật khẩu", exact: true }).fill("Ontap THPT 2026");
    await page.getByRole("textbox", { name: "Nhập lại mật khẩu" }).fill("Khac nhau 2026");
    await page.getByRole("button", { name: "Tạo tài khoản" }).click();
    await expect(page.getByText("Mật khẩu nhập lại không khớp")).toBeVisible();
    await expect(page.getByText("Bạn cần đồng ý điều khoản và chính sách quyền riêng tư")).toBeVisible();
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("health endpoint reports config booleans only", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.database).toBe("ok");
    expect(JSON.stringify(body)).not.toContain("mongodb://");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("unknown route shows Vietnamese 404", async ({ page }) => {
    const res = await page.goto("/khong-ton-tai");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Không tìm thấy trang")).toBeVisible();
  });
});
