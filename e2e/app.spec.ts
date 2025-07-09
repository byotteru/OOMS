import { test, expect, _electron as electron, ElectronApplication, Page } from "@playwright/test";
import path from "path";

test.describe("OOMS Application", () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [path.join(__dirname, "..", "out", "main", "index.js")] });
    page = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("アプリケーションが正常に起動すること", async () => {
    await expect(page).toHaveTitle(/OOMS/);
    await expect(page.locator("h1")).toContainText("OOMS - お弁当注文管理システム");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator(".nav-button")).toHaveCount(6);
  });

  test("週間注文管理ページが正常に表示されること", async () => {
    await expect(page.locator(".card-title")).toContainText("📝 週間注文管理");
    await expect(page.locator(".week-display")).toBeVisible();
  });
});