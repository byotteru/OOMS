import { test, expect } from "@playwright/test";

test.describe("ナビゲーションとページ遷移", () => {
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

  test("全ページへのナビゲーションが正常に動作すること", async ({ page }) => {
    // データ入力ページ（初期表示）
    await expect(page.locator(".card-title")).toContainText("📝 データ入力");
    await expect(page.locator(".nav-button.active")).toContainText(
      "データ入力"
    );

    // 当日注文一覧ページ
    await page.locator("text=当日注文一覧").click();
    await expect(page.locator(".card-title")).toContainText("📋 当日注文一覧");
    await expect(page.locator(".nav-button.active")).toContainText(
      "当日注文一覧"
    );

    // 週次発注書ページ
    await page.locator("text=週次発注書").click();
    await expect(page.locator(".card-title")).toContainText("📊 週次発注書");
    await expect(page.locator(".nav-button.active")).toContainText(
      "週次発注書"
    );

    // 月次集計ページ
    await page.locator("text=月次集計").click();
    await expect(page.locator(".card-title")).toContainText(
      "💰 月次集計（給与控除用）"
    );
    await expect(page.locator(".nav-button.active")).toContainText("月次集計");

    // スタッフ管理ページ
    await page.locator("text=スタッフ管理").click();
    await expect(page.locator(".card-title")).toContainText("👥 スタッフ管理");
    await expect(page.locator(".nav-button.active")).toContainText(
      "スタッフ管理"
    );

    // 弁当管理ページ
    await page.locator("text=弁当管理").click();
    await expect(page.locator(".card-title")).toContainText("🍱 弁当管理");
    await expect(page.locator(".nav-button.active")).toContainText("弁当管理");

    // 設定ページ
    await page.locator("text=設定").click();
    await expect(page.locator(".card-title")).toContainText(
      "⚙️ アプリケーション設定"
    );
    await expect(page.locator(".nav-button.active")).toContainText("設定");
  });

  test("ナビゲーションのアクティブ状態が正確に反映されること", async ({
    page,
  }) => {
    // 初期状態：データ入力がアクティブ
    await expect(page.locator(".nav-button.active")).toHaveCount(1);
    await expect(page.locator(".nav-button.active")).toContainText(
      "データ入力"
    );

    // スタッフ管理をクリック
    await page.locator("text=スタッフ管理").click();
    await expect(page.locator(".nav-button.active")).toHaveCount(1);
    await expect(page.locator(".nav-button.active")).toContainText(
      "スタッフ管理"
    );

    // データ入力に戻る
    await page.locator(".nav-button", { hasText: "データ入力" }).click();
    await expect(page.locator(".nav-button.active")).toHaveCount(1);
    await expect(page.locator(".nav-button.active")).toContainText(
      "データ入力"
    );
  });

  test("ページ遷移後にコンテンツが正しく表示されること", async ({ page }) => {
    // スタッフ管理ページの内容確認
    await page.locator("text=スタッフ管理").click();
    await page.waitForTimeout(1000);
    await expect(page.locator(".card-title")).toContainText("👥 スタッフ管理");
    await expect(page.locator("text=➕ スタッフ追加")).toBeVisible();

    // 弁当管理ページの内容確認
    await page.locator("text=弁当管理").click();
    await page.waitForTimeout(1000);
    await expect(page.locator(".card-title")).toContainText("🍱 弁当管理");
    await expect(page.locator("text=➕ 弁当追加")).toBeVisible();

    // 設定ページの内容確認
    await page.locator("text=設定").click();
    await page.waitForTimeout(1000);
    await expect(page.locator(".card-title")).toContainText(
      "⚙️ アプリケーション設定"
    );
    await expect(page.locator("text=園情報")).toBeVisible();
  });

  test("ヘッダー情報が全ページで表示されること", async ({ page }) => {
    const header = page.locator(".app-header");
    const title = page.locator(".app-title");
    const dateInfo = page.locator(".header-info");

    // 各ページでヘッダーが表示されることを確認
    const pages = [
      "データ入力",
      "当日注文一覧",
      "週次発注書",
      "月次集計",
      "スタッフ管理",
      "弁当管理",
      "設定",
    ];

    for (const pageName of pages) {
      // より具体的なセレクターを使用してstrict mode violationを回避
      if (pageName === "データ入力") {
        await page.locator(".nav-button", { hasText: "データ入力" }).click();
      } else {
        await page.locator(`.nav-button:has-text("${pageName}")`).click();
      }

      await expect(header).toBeVisible();
      await expect(title).toContainText("OOMS - お弁当注文管理システム");
      await expect(dateInfo).toBeVisible();
      await expect(dateInfo).toContainText(/\d{4}年\d{1,2}月\d{1,2}日/);
    }
  });

  test("ナビゲーションセクションが適切にグループ化されていること", async ({
    page,
  }) => {
    const navSections = page.locator(".nav-section");
    await expect(navSections).toHaveCount(4);

    // セクションタイトルの確認
    await expect(page.locator(".nav-section h3").nth(0)).toContainText(
      "日常業務"
    );
    await expect(page.locator(".nav-section h3").nth(1)).toContainText(
      "集計・レポート"
    );
    await expect(page.locator(".nav-section h3").nth(2)).toContainText(
      "マスタ管理"
    );
    await expect(page.locator(".nav-section h3").nth(3)).toContainText(
      "システム"
    );

    // 各セクション内のボタン数を確認
    await expect(
      page.locator(".nav-section").nth(0).locator(".nav-button")
    ).toHaveCount(2);
    await expect(
      page.locator(".nav-section").nth(1).locator(".nav-button")
    ).toHaveCount(2);
    await expect(
      page.locator(".nav-section").nth(2).locator(".nav-button")
    ).toHaveCount(2);
    await expect(
      page.locator(".nav-section").nth(3).locator(".nav-button")
    ).toHaveCount(1);
  });
});
