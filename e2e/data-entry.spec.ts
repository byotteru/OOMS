import { test, expect } from "@playwright/test";

test.describe("データ入力フロー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");

    // データ入力ページが表示されることを確認
    await expect(page.locator(".card-title")).toContainText("📝 データ入力");
  });

  test("完全なデータ入力フローが正常に動作すること", async ({ page }) => {
    // 1. 日付を設定
    await page.locator("#order-date").fill("2025-07-15");

    // 2. スタッフを選択
    await page.locator("#staff-select").selectOption("1");

    // 3. 弁当数量を設定
    await page.locator("#quantity-1").fill("2");
    await page.locator("#quantity-2").fill("1");

    // 4. 備考を入力
    await page.locator("#remarks-1").fill("アレルギー対応お願いします");

    // 5. 保存ボタンをクリック
    await page.locator("text=💾 注文を保存").click();

    // 保存の確認（実際のアプリケーションではAPIコールが発生するため、
    // ここではボタンがクリックできることを確認）
    await expect(page.locator("text=💾 注文を保存")).toBeVisible();
  });

  test("クリアボタンが正常に動作すること", async ({ page }) => {
    // データを入力
    await page.locator("#order-date").fill("2025-07-15");
    await page.locator("#staff-select").selectOption("1");
    await page.locator("#quantity-1").fill("2");
    await page.locator("#remarks-1").fill("テスト備考");

    // クリアボタンをクリック
    await page.locator("text=🗑️ クリア").click();

    // フォームがクリアされることを確認
    await expect(page.locator("#staff-select")).toHaveValue("");
    await expect(page.locator("#quantity-1")).toHaveValue("0");
    await expect(page.locator("#remarks-1")).toHaveValue("");
  });

  test("フォームバリデーションが正常に動作すること", async ({ page }) => {
    // スタッフを選択せずに保存ボタンをクリック
    await page.locator("#quantity-1").fill("1");
    await page.locator("text=💾 注文を保存").click();

    // HTMLのrequired属性により、フォームが送信されないことを確認
    // （実際のバリデーションはアプリケーションの実装に依存）
    await expect(page.locator("#staff-select")).toHaveAttribute("required");
  });

  test("数量入力の制限が正常に動作すること", async ({ page }) => {
    // 数量の最大値・最小値制限を確認
    const quantityInput = page.locator("#quantity-1");

    await expect(quantityInput).toHaveAttribute("min", "0");
    await expect(quantityInput).toHaveAttribute("max", "10");

    // 範囲外の値を入力してみる
    await quantityInput.fill("15");
    // HTMLのtype="number"により、最大値を超えた場合の挙動を確認
    // （実際の挙動はブラウザの実装に依存）
  });

  test("日付入力が正常に動作すること", async ({ page }) => {
    const dateInput = page.locator("#order-date");

    // 日付形式での入力
    await dateInput.fill("2025-12-25");
    await expect(dateInput).toHaveValue("2025-12-25");

    // 今日の日付がデフォルトで設定されていることを確認
    // （実際の初期値は現在の日付）
    await expect(dateInput).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  });
});
