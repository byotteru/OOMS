import { test, expect, _electron as electron, ElectronApplication, Page } from "@playwright/test";
import path from "path";

test.describe("ナビゲーションとページ遷移", () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [path.join(__dirname, "..", "out", "main", "index.js")] });
    page = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("全ページへのナビゲーションが正常に動作すること", async () => {
    await page.locator("text=週次発注書").click();
    await expect(page.locator(".card-title")).toContainText("📊 週次発注書");

    await page.locator("text=月次集計").click();
    await expect(page.locator(".card-title")).toContainText("💰 月次集計");

    await page.locator("text=スタッフ管理").click();
    await expect(page.locator(".card-title")).toContainText("👥 スタッフ管理");

    await page.locator("text=弁当管理").click();
    await expect(page.locator(".card-title")).toContainText("🍱 弁当管理");

    await page.locator("text=設定").click();
    await expect(page.locator(".card-title")).toContainText("⚙️ アプリケーション設定");

    await page.locator("text=週間注文管理").click();
    await expect(page.locator(".card-title")).toContainText("📝 週間注文管理");
  });
});