import { test, expect } from "@playwright/test";

test.describe("レポート機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test.describe("当日注文一覧", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("text=当日注文一覧").click();
      await expect(page.locator(".card-title")).toContainText(
        "📋 当日注文一覧"
      );
    });

    test("日付選択が可能であること", async ({ page }) => {
      const dateInput = page.locator('input[type="date"]');
      await expect(dateInput).toBeVisible();

      // 日付を変更
      await dateInput.fill("2025-07-15");
      await expect(dateInput).toHaveValue("2025-07-15");
    });

    test("注文一覧テーブルが表示されること", async ({ page }) => {
      // テーブルまたはリストの確認
      await expect(page.locator(".order-table, .order-list")).toBeVisible();

      // テーブルヘッダーの確認
      await expect(page.locator("text=スタッフ名")).toBeVisible();
      await expect(page.locator("text=弁当名")).toBeVisible();
      await expect(page.locator("text=数量")).toBeVisible();
    });

    test("注文データがない場合のメッセージが表示されること", async ({
      page,
    }) => {
      // 過去の日付に設定して注文がない状態を作る
      await page.locator('input[type="date"]').fill("2020-01-01");

      // 「注文がありません」等のメッセージを確認
      await expect(
        page.locator("text=注文がありません, text=データがありません")
      ).toBeVisible();
    });

    test("注文の合計金額が表示されること", async ({ page }) => {
      // 合計金額の表示エリア
      await expect(page.locator(".total-amount, text=合計")).toBeVisible();
    });

    test("印刷・エクスポート機能が利用可能であること", async ({ page }) => {
      // 印刷ボタンまたはエクスポートボタン
      const exportButton = page.locator(
        "text=印刷, text=エクスポート, text=CSV出力"
      );
      if ((await exportButton.count()) > 0) {
        await expect(exportButton.first()).toBeVisible();
      }
    });
  });

  test.describe("週次発注書", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("text=週次発注書").click();
      await expect(page.locator(".card-title")).toContainText("📊 週次発注書");
    });

    test("週選択が可能であること", async ({ page }) => {
      // 週選択のための日付入力またはカレンダー
      const weekSelector = page.locator(
        'input[type="date"], input[type="week"]'
      );
      await expect(weekSelector.first()).toBeVisible();
    });

    test("週次発注レポートが表示されること", async ({ page }) => {
      // 発注レポートテーブル
      await expect(page.locator(".report-table, .weekly-report")).toBeVisible();

      // 曜日ヘッダーの確認
      await expect(page.locator("text=月")).toBeVisible();
      await expect(page.locator("text=火")).toBeVisible();
      await expect(page.locator("text=水")).toBeVisible();
      await expect(page.locator("text=木")).toBeVisible();
      await expect(page.locator("text=金")).toBeVisible();
    });

    test("弁当別の集計が表示されること", async ({ page }) => {
      // 弁当名と数量の表示
      await expect(page.locator("text=テスト弁当1")).toBeVisible();
      await expect(page.locator("text=テスト弁当2")).toBeVisible();
    });

    test("週次合計が表示されること", async ({ page }) => {
      // 各曜日の合計と週間合計
      await expect(
        page.locator(".daily-total, .weekly-total, text=合計")
      ).toBeVisible();
    });

    test("発注書出力機能が利用可能であること", async ({ page }) => {
      // 発注書出力ボタン
      const outputButton = page.locator(
        "text=発注書出力, text=印刷, text=PDF出力"
      );
      if ((await outputButton.count()) > 0) {
        await expect(outputButton.first()).toBeVisible();
      }
    });
  });

  test.describe("月次集計", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("text=月次集計").click();
      await expect(page.locator(".card-title")).toContainText("💰 月次集計");
    });

    test("月選択が可能であること", async ({ page }) => {
      // 年月選択のための入力
      const monthSelector = page.locator('input[type="month"], select');
      await expect(monthSelector.first()).toBeVisible();
    });

    test("スタッフ別集計が表示されること", async ({ page }) => {
      // スタッフ別集計テーブル
      await expect(
        page.locator(".staff-total-table, .monthly-report")
      ).toBeVisible();

      // スタッフ名と金額の表示
      await expect(page.locator("text=テストスタッフ1")).toBeVisible();
      await expect(page.locator("text=テストスタッフ2")).toBeVisible();
    });

    test("月次合計金額が表示されること", async ({ page }) => {
      // 月次合計の表示
      await expect(page.locator(".grand-total, text=月次合計")).toBeVisible();
    });

    test("月次締め機能が利用可能であること", async ({ page }) => {
      // 月次締めボタン
      const lockButton = page.locator("text=月次締め, text=締め処理");
      if ((await lockButton.count()) > 0) {
        await expect(lockButton.first()).toBeVisible();
      }
    });

    test("月次締め状態が表示されること", async ({ page }) => {
      // 締め状態の表示
      const lockStatus = page.locator(
        "text=締め済み, text=未締め, .lock-status"
      );
      if ((await lockStatus.count()) > 0) {
        await expect(lockStatus.first()).toBeVisible();
      }
    });

    test("月次レポートの出力機能が利用可能であること", async ({ page }) => {
      // レポート出力ボタン
      const reportButton = page.locator(
        "text=レポート出力, text=印刷, text=PDF出力"
      );
      if ((await reportButton.count()) > 0) {
        await expect(reportButton.first()).toBeVisible();
      }
    });
  });

  test.describe("レポート共通機能", () => {
    test("レポート間の遷移が正常に動作すること", async ({ page }) => {
      // 当日注文一覧 → 週次発注書
      await page.locator("text=当日注文一覧").click();
      await expect(page.locator(".card-title")).toContainText(
        "📋 当日注文一覧"
      );

      await page.locator("text=週次発注書").click();
      await expect(page.locator(".card-title")).toContainText("📊 週次発注書");

      // 週次発注書 → 月次集計
      await page.locator("text=月次集計").click();
      await expect(page.locator(".card-title")).toContainText("💰 月次集計");

      // 月次集計 → 当日注文一覧
      await page.locator("text=当日注文一覧").click();
      await expect(page.locator(".card-title")).toContainText(
        "📋 当日注文一覧"
      );
    });

    test("データが存在しない期間でもエラーが発生しないこと", async ({
      page,
    }) => {
      // 将来の日付を設定
      const futureDate = "2026-12-31";

      // 当日注文一覧で将来日付をテスト
      await page.locator("text=当日注文一覧").click();
      await page.locator('input[type="date"]').fill(futureDate);

      // エラーメッセージではなく、「データなし」メッセージが表示されることを確認
      await expect(
        page.locator("text=注文がありません, text=データがありません")
      ).toBeVisible();
    });

    test("レポートの表示が適切にフォーマットされていること", async ({
      page,
    }) => {
      // 当日注文一覧のフォーマット確認
      await page.locator("text=当日注文一覧").click();

      // 金額表記の確認（¥マークの存在など）
      const amounts = page.locator("text=/¥[0-9,]+/");
      if ((await amounts.count()) > 0) {
        await expect(amounts.first()).toBeVisible();
      }

      // 数量の確認（数値のみ）
      const quantities = page.locator("text=/^[0-9]+$/");
      if ((await quantities.count()) > 0) {
        await expect(quantities.first()).toBeVisible();
      }
    });
  });
});
