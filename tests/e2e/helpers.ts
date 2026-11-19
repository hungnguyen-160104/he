import { expect, type Page } from "@playwright/test";

export const ADMIN = { username: "e2e_admin", email: "e2e_admin@example.com", password: "E2E quan tri 2026" };

export async function login(page: Page, identifier: string, password: string) {
  await page.goto("/dang-nhap");
  await page.getByRole("textbox", { name: "Tên đăng nhập hoặc email" }).fill(identifier);
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/dang-nhap/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Tài khoản" }).click();
  await page.getByRole("menuitem", { name: "Đăng xuất" }).click();
  await expect(page.getByRole("link", { name: "Đăng ký" }).first()).toBeVisible();
}

export async function register(page: Page, username: string, email: string, password: string) {
  await page.goto("/dang-ky");
  await page.getByRole("textbox", { name: "Tên đăng nhập" }).fill(username);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Mật khẩu", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Nhập lại mật khẩu" }).fill(password);
  await page.getByRole("checkbox", { name: /Tôi đồng ý/ }).check();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
}

export const uniq = () => Math.random().toString(36).slice(2, 8);
