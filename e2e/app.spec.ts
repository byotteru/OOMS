import { test, expect } from "@playwright/test";

test.describe("OOMS Application", () => {
  test.beforeEach(async ({ page }) => {
    // HTTP server経由でアクセス
    await page.goto("/");

    // Reactアプリが読み込まれるまで待機
    await page.waitForFunction(
      () => {
        const root = document.querySelector("#root");
        return root && root.children.length > 0;
      },
      { timeout: 15000 }
    );

    // データがロードされるまで待機（非ローディング状態を確認）
    await page.waitForFunction(
      () => {
        const loadingElement = document.querySelector(".loading-indicator");
        return !loadingElement;
      },
      { timeout: 20000 }
    );

    await page.waitForTimeout(2000); // 追加の安定化待機
  });

  test("アプリケーションが正常に起動すること", async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/OOMS/);

    // メインヘッダーの確認
    await expect(page.locator("h1")).toContainText(
      "OOMS - お弁当注文管理システム"
    );

    // ナビゲーションメニューの確認
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator(".nav-button")).toHaveCount(7); // データ入力、当日注文一覧、週次発注書、月次集計、スタッフ管理、弁当管理、設定
  });

  test("データ入力ページが正常に表示されること", async ({ page }) => {
    // データ入力ページが初期表示されることを確認
    await expect(page.locator(".card-title")).toContainText("📝 データ入力");

    // フォーム要素の確認
    await expect(page.locator("#order-date")).toBeVisible();
    await expect(page.locator("#staff-select")).toBeVisible();

    // 弁当データがロードされるまで待機
    await page.waitForFunction(
      () => {
        const itemCards = document.querySelectorAll(".item-card");
        return itemCards.length >= 2; // 2つの弁当データが存在する
      },
      { timeout: 15000 }
    );

    // 弁当選択セクションの確認
    await expect(page.locator(".items-container")).toBeVisible();
    await expect(page.locator(".item-card")).toHaveCount(2); // テスト用の2つの弁当
  });

  test("スタッフ選択が正常に動作すること", async ({ page }) => {
    // スタッフデータがロードされるまで待機
    await page.waitForFunction(
      () => {
        const selectElement = document.querySelector("#staff-select");
        return selectElement && selectElement.children.length > 1; // 1 is "スタッフを選択" option
      },
      { timeout: 15000 }
    );

    // スタッフセレクトボックスをクリック
    await page.locator("#staff-select").click();

    // スタッフオプションの確認（「スタッフを選択」オプション + 3つのスタッフ）
    await expect(page.locator("#staff-select option")).toHaveCount(4);

    // スタッフを選択
    await page.locator("#staff-select").selectOption("1");
    await expect(page.locator("#staff-select")).toHaveValue("1");
  });

  test("弁当数量の変更が正常に動作すること", async ({ page }) => {
    // 弁当データがロードされるまで待機
    await page.waitForFunction(
      () => {
        const itemCards = document.querySelectorAll(".item-card");
        return itemCards.length >= 2;
      },
      { timeout: 15000 }
    );

    // 最初の弁当の数量を変更
    const quantityInput = page.locator("#quantity-1");
    await quantityInput.fill("3");
    await expect(quantityInput).toHaveValue("3");

    // 2番目の弁当の数量を変更
    const quantityInput2 = page.locator("#quantity-2");
    await quantityInput2.fill("2");
    await expect(quantityInput2).toHaveValue("2");
  });

  test("ナビゲーションが正常に動作すること", async ({ page }) => {
    // 当日注文一覧ページに移動
    await page.locator("text=当日注文一覧").click();
    await page.waitForTimeout(1000); // ページ遷移を待機
    await expect(page.locator(".card-title")).toContainText("📋 当日注文一覧");

    // 週次発注書ページに移動
    await page.locator("text=週次発注書").click();
    await page.waitForTimeout(1000); // ページ遷移を待機
    await expect(page.locator(".card-title")).toContainText("📊 週次発注書");

    // スタッフ管理ページに移動
    await page.locator("text=スタッフ管理").click();
    await page.waitForTimeout(1000); // ページ遷移を待機
    await expect(page.locator(".card-title")).toContainText("👥 スタッフ管理");

    // データ入力ページに戻る
    await page.locator(".nav-button", { hasText: "データ入力" }).click();
    await page.waitForTimeout(1000); // ページ遷移を待機
    await expect(page.locator(".card-title")).toContainText("📝 データ入力");
  });

  test("レスポンシブデザインが正常に動作すること", async ({ page }) => {
    // デスクトップサイズでの確認
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator(".main-container")).toBeVisible();

    // タブレットサイズでの確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator(".main-container")).toBeVisible();

    // モバイルサイズでの確認
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator(".main-container")).toBeVisible();
  });
});
