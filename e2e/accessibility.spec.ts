import { test, expect, _electron as electron, ElectronApplication, Page } from "@playwright/test";
import path from "path";

test.describe("アクセシビリティとユーザビリティ", () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [path.join(__dirname, "..", "out", "main", "index.js")] });
    page = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test.describe("キーボードナビゲーション", () => {
    test("Tabキーによるフォーカス移動が正常に動作すること", async () => {
      await page.locator('body').press('Tab');
      await expect(page.locator(".nav-button.active")).toBeFocused();
    });
  });
});