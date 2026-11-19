import { expect, test, type Page } from "@playwright/test";
import { ADMIN, login, register, uniq } from "./helpers";

const PW = "Hoc tap cham chi 2026";

async function answerAllPerfectlyOrNot(page: Page, mode: "first" | "blank") {
  // Navigate through every question using the numbered navigator and answer something.
  const total = Number((await page.getByText(/^Đã làm \d+\/\d+ câu$/).first().textContent())?.match(/\/(\d+)/)?.[1] ?? 0);
  for (let i = 0; i < total; i++) {
    if (mode === "first") {
      const radios = page.locator("main input[type=radio]");
      const text = page.getByRole("textbox", { name: "Câu trả lời của bạn" });
      if (await text.isVisible().catch(() => false)) {
        await text.fill("1");
      } else if ((await radios.count()) > 0) {
        // Single choice: first option; True/false: "Đúng" for every statement.
        const tfGroups = page.locator("main fieldset fieldset");
        if ((await tfGroups.count()) > 0) {
          for (let j = 0; j < (await tfGroups.count()); j++) await tfGroups.nth(j).getByText("Đúng", { exact: true }).click();
        } else {
          await radios.first().check();
        }
      }
    }
    if (i < total - 1) await page.getByRole("button", { name: "Câu sau" }).click();
  }
  return total;
}

test.describe("Phase 5–7 — exam journeys", () => {
  test.describe.configure({ timeout: 180_000 });
  test("student: practice + mock exam (answer, refresh/resume, submit, score & explanation), retake, history", async ({ page }) => {
    const u = `thi_${uniq()}`;
    await register(page, u, `${u}@example.com`, PW);
    await expect(page).toHaveURL(/\/dashboard$/);

    // Mock exam (not in a campaign → answers released after submission)
    await page.goto("/de-thi?q=Đề thi thử số 1");
    await page.getByRole("link", { name: /Toán — Đề thi thử số 1/ }).click();
    await page.getByRole("button", { name: "Bắt đầu làm bài" }).click();
    await expect(page).toHaveURL(/\/lam-bai\//);
    await expect(page.getByRole("heading", { name: /Câu 1/ })).toBeVisible();
    // Server-driven countdown is visible
    await expect(page.locator('[aria-label^="Thời gian còn lại"]:visible')).toBeVisible();

    // Answer question 1 (single choice) and wait for autosave
    await page.locator("main input[type=radio]").first().check();
    await expect(page.getByText("Đã lưu", { exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 10_000 });

    // Refresh → resume with the saved answer
    await page.reload();
    await expect(page.locator("main input[type=radio]").first()).toBeChecked();

    await answerAllPerfectlyOrNot(page, "first");
    await expect(page.getByText("Đã lưu", { exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /^Nộp bài/ }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Nộp bài" }).click();
    await expect(page).toHaveURL(/\/ket-qua\//);
    await expect(page.getByText("Điểm (thang 10)")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chi tiết từng câu" })).toBeVisible();
    await expect(page.getByText("Lời giải").first()).toBeVisible();
    await expect(page.getByText("Lượt đầu tiên")).toBeVisible();

    // Retake → marked as retake
    await page.getByRole("link", { name: "Làm lại" }).click();
    await page.getByRole("button", { name: "Bắt đầu làm bài" }).click();
    await expect(page).toHaveURL(/\/lam-bai\//);
    await page.getByRole("button", { name: /^Nộp bài/ }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Nộp bài" }).click();
    await expect(page.getByText(/Lượt làm lại/)).toBeVisible();

    // Practice session
    await page.goto("/luyen-tap");
    const toan = await page.getByLabel("Môn học").locator("option", { hasText: "Toán" }).first().getAttribute("value");
    await page.getByLabel("Môn học").selectOption(toan!);
    await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
    await expect(page).toHaveURL(/\/lam-bai\//);
    await expect(page.getByText("Không giới hạn thời gian").filter({ visible: true }).first()).toBeVisible();

    // History shows both mock attempts + the practice in progress
    await page.goto("/lich-su");
    await expect(page.getByRole("link", { name: /Toán — Đề thi thử số 1/ })).toHaveCount(2);
    await expect(page.getByText("Làm lại", { exact: false }).first()).toBeVisible();
  });

  test("anti-leak: exam/attempt payloads never contain answers; foreign attempts are 404", async ({ page, request }) => {
    const list = await (await request.get("/api/exams?limit=50")).json();
    const exam = list.data.find((e: { title: string }) => e.title.includes("Đề thi thử số 1"));
    const detail = await (await request.get(`/api/exams/${exam.id}`)).text();
    expect(detail).not.toMatch(/correctOptionId|acceptedAnswers|explanation|"stem"/);

    const u = `leak_${uniq()}`;
    await register(page, u, `${u}@example.com`, PW);
    await expect(page).toHaveURL(/\/dashboard$/);
    const start = await page.request.post("/api/attempts", { data: { examId: exam.id, idempotencyKey: `e2e${uniq()}${uniq()}` } });
    expect(start.status()).toBe(201);
    const { data } = await start.json();
    const taking = await (await page.request.get(`/api/attempts/${data.attemptId}`)).text();
    expect(taking).not.toMatch(/correctOptionId|acceptedAnswers|explanation|tolerance|questionVersionId/);
    // Another user cannot read it
    const other = await page.context().browser()!.newContext();
    const op = await other.newPage();
    const u2 = `leak2_${uniq()}`;
    await register(op, u2, `${u2}@example.com`, PW);
    await expect(op).toHaveURL(/\/dashboard$/);
    expect((await op.request.get(`/api/attempts/${data.attemptId}`)).status()).toBe(404);
    expect((await op.request.get(`/api/attempts/not-an-id`)).status()).toBe(404);
    await other.close();
  });

  test("ranking: completing 2/2 weekly exams ranks; 1/2 shows progress; answers withheld during the campaign", async ({ page, browser }) => {
    const u = `rank_${uniq()}`;
    await register(page, u, `${u}@example.com`, PW);
    await expect(page).toHaveURL(/\/dashboard$/);
    for (const n of ["1/2", "2/2"]) {
      await page.goto(`/de-thi?q=${encodeURIComponent(`xếp hạng tuần (${n})`)}`);
      await page.getByRole("link", { name: new RegExp(`xếp hạng tuần \\(${n.replace("/", "\\/")}\\)`) }).click();
      await expect(page.getByText(/^Thuộc kỳ xếp hạng: .*Chỉ lượt làm đầu tiên trong kỳ được tính\.$/)).toBeVisible();
      await page.getByRole("button", { name: "Bắt đầu làm bài" }).click();
      await expect(page).toHaveURL(/\/lam-bai\//);
      await answerAllPerfectlyOrNot(page, "first");
      await expect(page.getByText("Đã lưu", { exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 10_000 });
      await page.getByRole("button", { name: /^Nộp bài/ }).first().click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Nộp bài" }).click();
      await expect(page).toHaveURL(/\/ket-qua\//);
      await expect(page.getByText("Đáp án và lời giải chưa được công bố")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Chi tiết từng câu" })).toHaveCount(0);
    }
    await page.goto("/bang-xep-hang");
    await expect(page.getByText("Đang diễn ra")).toBeVisible();
    await expect(page.getByText(/Bạn đang xếp hạng #\d+/)).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(u) })).toBeVisible();

    // Second student completes only 1/2 → not ranked, sees progress
    const ctx = await browser.newContext();
    const p2 = await ctx.newPage();
    const u2 = `half_${uniq()}`;
    await register(p2, u2, `${u2}@example.com`, PW);
    await expect(p2).toHaveURL(/\/dashboard$/);
    await p2.goto(`/de-thi?q=${encodeURIComponent("xếp hạng tuần (1/2)")}`);
    await p2.getByRole("link", { name: /xếp hạng tuần \(1\/2\)/ }).click();
    await p2.getByRole("button", { name: "Bắt đầu làm bài" }).click();
    await expect(p2).toHaveURL(/\/lam-bai\//);
    await p2.getByRole("button", { name: /^Nộp bài/ }).first().click();
    await p2.getByRole("alertdialog").getByRole("button", { name: "Nộp bài" }).click();
    await expect(p2).toHaveURL(/\/ket-qua\//);
    await p2.goto("/bang-xep-hang");
    await expect(p2.getByText(/Bạn đã hoàn thành 1\/2 đề/)).toBeVisible();
    await expect(p2.getByRole("row", { name: new RegExp(u2) })).toHaveCount(0);
    await ctx.close();
  });

  test("teacher authoring → admin rejects with reason → teacher revises → admin approves & publishes", async ({ page, browser }) => {
    test.setTimeout(240_000);
    // Admin creates the teacher
    await login(page, ADMIN.username, ADMIN.password);
    await page.goto("/quan-tri/nguoi-dung");
    const t = `gv_${uniq()}`;
    await page.getByRole("button", { name: "Tạo giáo viên" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByRole("textbox", { name: "Tên đăng nhập" }).fill(t);
    await dlg.getByRole("textbox", { name: "Email" }).fill(`${t}@example.com`);
    await dlg.getByRole("textbox", { name: "Tên hiển thị" }).fill("Cô Kiểm Thử");
    await dlg.getByRole("button", { name: "Tạo tài khoản" }).click();
    const temp = (await page.getByTestId("temp-password").textContent())!.trim();
    await page.getByRole("button", { name: "Đã lưu mật khẩu" }).click();

    const tctx = await browser.newContext();
    const tp = await tctx.newPage();
    await login(tp, t, temp);
    const newPw = "Giao vien moi 2026";
    await tp.getByRole("textbox", { name: "Mật khẩu hiện tại" }).fill(temp);
    await tp.getByRole("textbox", { name: "Mật khẩu mới", exact: true }).fill(newPw);
    await tp.getByRole("textbox", { name: "Nhập lại mật khẩu mới" }).fill(newPw);
    await tp.getByRole("button", { name: "Đổi mật khẩu" }).click();
    await expect(tp).toHaveURL(/\/dang-nhap/);
    await login(tp, t, newPw);
    await expect(tp).toHaveURL(/\/giao-vien$/);

    // Teacher creates one question of each type
    const make = async (type: string, fill: () => Promise<void>) => {
      await tp.goto("/giao-vien/cau-hoi/moi");
      await tp.getByLabel("Môn học").selectOption({ label: "Toán" });
      await tp.getByLabel("Dạng câu hỏi").selectOption({ label: type });
      await tp.getByRole("tab", { name: "2. Nội dung" }).click();
      await fill();
      await tp.getByRole("button", { name: "Lưu & gửi duyệt" }).click();
      await expect(tp).toHaveURL(/\/giao-vien\/cau-hoi\/[a-f0-9]{24}$/);
      await expect(tp.getByText("Chờ duyệt").first()).toBeVisible();
    };
    await make("Trắc nghiệm nhiều lựa chọn", async () => {
      await tp.getByLabel("Đề bài").fill(`E2E ${t}: $1+1$ bằng?`);
      for (const [id, v] of [["A", "1"], ["B", "2"], ["C", "3"], ["D", "4"]]) await tp.getByLabel(`Phương án ${id}`).fill(v!);
      await expect(tp.getByRole("complementary", { name: "Xem trước" }).locator(".katex").first()).toBeVisible();
      await tp.getByRole("tab", { name: "3. Đáp án & lời giải" }).click();
      await tp.getByRole("radio", { name: "B" }).check();
    });
    await make("Trắc nghiệm đúng/sai", async () => {
      await tp.getByLabel("Đề bài").fill(`E2E ${t}: xét số 4.`);
      for (const id of ["a", "b", "c", "d"]) await tp.getByLabel(`Ý ${id})`).fill(`Phát biểu ${id}`);
      await tp.getByRole("tab", { name: "3. Đáp án & lời giải" }).click();
      for (const id of ["a", "b", "c", "d"]) await tp.locator(`input[name="tf-${id}"]`).first().check();
    });
    await make("Trả lời ngắn", async () => {
      await tp.getByLabel("Đề bài").fill(`E2E ${t}: tính $3/2$.`);
      await tp.getByRole("tab", { name: "3. Đáp án & lời giải" }).click();
      await tp.getByLabel(/Các đáp án chấp nhận/).fill("1,5");
    });

    // Admin approves the 3 questions
    await page.goto("/quan-tri/duyet-de?tab=questions");
    // The seed approves all DEMO questions, so the queue holds exactly this teacher's 3 questions.
    await expect(page.getByRole("button", { name: "Duyệt", exact: true })).toHaveCount(3);
    for (let left = 3; left > 0; left--) {
      await page.getByRole("button", { name: "Duyệt", exact: true }).first().click();
      await expect(page.getByRole("button", { name: "Duyệt", exact: true })).toHaveCount(left - 1);
    }

    // Teacher builds an exam from the 3 approved questions and submits
    await tp.goto("/giao-vien/de-thi/moi");
    const title = `E2E đề ${t}`;
    await tp.getByLabel("Tên đề *").fill(title);
    await tp.getByLabel("Môn học").selectOption({ label: "Toán" });
    await tp.getByRole("textbox", { name: "Tìm câu hỏi" }).fill(`e2e ${t}`);
    await tp.getByRole("button", { name: "Tìm" }).click();
    await expect(tp.getByRole("button", { name: "Thêm", exact: true })).toHaveCount(3);
    for (let i = 0; i < 3; i++) await tp.getByRole("button", { name: "Thêm", exact: true }).first().click();
    await tp.getByRole("button", { name: "Lưu & gửi duyệt" }).click();
    await expect(tp.getByText("Chờ duyệt").first()).toBeVisible();

    // Admin rejects with reason
    await page.goto("/quan-tri/duyet-de");
    await page.getByRole("link", { name: new RegExp(title) }).click();
    await page.getByRole("button", { name: "Từ chối" }).click();
    await page.getByRole("dialog").getByRole("textbox").fill("Cần thêm mô tả cho đề.");
    await page.getByRole("dialog").getByRole("button", { name: "Từ chối" }).click();
    await expect(page).toHaveURL(/\/quan-tri\/duyet-de$/);

    // Teacher sees the reason, revises and resubmits
    await tp.goto("/giao-vien/de-thi?status=REJECTED");
    await tp.getByRole("link", { name: title }).click();
    await expect(tp.getByText("Lý do từ chối: Cần thêm mô tả cho đề.")).toBeVisible();
    await tp.getByLabel("Mô tả").fill("Đề kiểm tra E2E gồm 3 dạng câu hỏi.");
    await tp.getByRole("button", { name: "Lưu & gửi duyệt" }).click();
    await expect(tp.getByText("Chờ duyệt").first()).toBeVisible();

    // Admin approves → exam is public
    await page.goto("/quan-tri/duyet-de");
    await page.getByRole("link", { name: new RegExp(title) }).click();
    await page.getByRole("button", { name: "Duyệt & xuất bản" }).click();
    await expect(page).toHaveURL(/\/quan-tri\/duyet-de$/);
    await page.goto(`/de-thi?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await tctx.close();
  });

  test("exam-taking screen is usable at 360px without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const u = `mob_${uniq()}`;
    await register(page, u, `${u}@example.com`, PW);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/de-thi?q=Tiếng Anh");
    await page.getByRole("link", { name: /Tiếng Anh — Đề thi thử/ }).click();
    await page.getByRole("button", { name: "Bắt đầu làm bài" }).click();
    await expect(page).toHaveURL(/\/lam-bai\//);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    await page.getByRole("button", { name: "Mở danh sách câu" }).click();
    await expect(page.getByRole("list", { name: "Danh sách câu hỏi" })).toBeVisible();
    // Picking a question closes the sheet; the bottom bar offers previous/next within thumb reach.
    await page.getByRole("dialog").getByRole("listitem", { name: /^Câu 2,/ }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("heading", { name: /^Câu 2\b/ })).toBeVisible();
    await page.getByRole("button", { name: "Câu sau" }).click();
    await expect(page.getByRole("heading", { name: /^Câu 3\b/ })).toBeVisible();
    await page.getByRole("button", { name: "Câu trước" }).click();
    await expect(page.getByRole("heading", { name: /^Câu 2\b/ })).toBeVisible();
    // Area tabs are hidden on phones while taking an exam (focus mode).
    await expect(page.getByRole("navigation", { name: "Góc học tập" })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    for (const path of ["/dashboard", "/lich-su", "/luyen-tap", "/bang-xep-hang", "/ho-so"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), path).toBe(false);
    }
  });
});
