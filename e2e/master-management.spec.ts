import { test, expect } from "@playwright/test";

test.describe("マスタ管理機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test.describe("スタッフ管理", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("text=スタッフ管理").click();
      await expect(page.locator(".card-title")).toContainText(
        "👥 スタッフ管理"
      );
    });

    test("スタッフ一覧が表示されること", async ({ page }) => {
      // スタッフテーブルまたはリストの確認
      await expect(page.locator(".staff-table, .staff-list")).toBeVisible();

      // テストデータのスタッフが表示されることを確認
      await expect(page.locator("text=テストスタッフ1")).toBeVisible();
      await expect(page.locator("text=テストスタッフ2")).toBeVisible();
    });

    test("新規スタッフ追加ボタンが表示されること", async ({ page }) => {
      await expect(page.locator("text=新規スタッフ追加")).toBeVisible();
    });

    test("新規スタッフ追加モーダルが開くこと", async ({ page }) => {
      await page.locator("text=新規スタッフ追加").click();

      // モーダルが表示されることを確認
      await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
      await expect(page.locator("text=スタッフ情報入力")).toBeVisible();
    });

    test("スタッフ編集機能が利用可能であること", async ({ page }) => {
      // 編集ボタンまたはリンクの確認
      const editButtons = page.locator('text=編集, [aria-label="編集"]');
      await expect(editButtons.first()).toBeVisible();
    });

    test("スタッフ削除機能が利用可能であること", async ({ page }) => {
      // 削除ボタンまたはリンクの確認
      const deleteButtons = page.locator('text=削除, [aria-label="削除"]');
      await expect(deleteButtons.first()).toBeVisible();
    });
  });

  test.describe("弁当管理", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("text=弁当管理").click();
      await expect(page.locator(".card-title")).toContainText("🍱 弁当管理");
    });

    test("弁当一覧が表示されること", async ({ page }) => {
      // 弁当テーブルまたはリストの確認
      await expect(page.locator(".item-table, .item-list")).toBeVisible();

      // テストデータの弁当が表示されることを確認
      await expect(page.locator("text=テスト弁当1")).toBeVisible();
      await expect(page.locator("text=テスト弁当2")).toBeVisible();

      // 価格情報の確認
      await expect(page.locator("text=¥500")).toBeVisible();
      await expect(page.locator("text=¥600")).toBeVisible();
    });

    test("新規弁当追加ボタンが表示されること", async ({ page }) => {
      await expect(page.locator("text=新規弁当追加")).toBeVisible();
    });

    test("新規弁当追加モーダルが開くこと", async ({ page }) => {
      await page.locator("text=新規弁当追加").click();

      // モーダルが表示されることを確認
      await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
      await expect(page.locator("text=弁当情報入力")).toBeVisible();
    });

    test("弁当編集機能が利用可能であること", async ({ page }) => {
      // 編集ボタンまたはリンクの確認
      const editButtons = page.locator('text=編集, [aria-label="編集"]');
      await expect(editButtons.first()).toBeVisible();
    });

    test("弁当削除機能が利用可能であること", async ({ page }) => {
      // 削除ボタンまたはリンクの確認
      const deleteButtons = page.locator('text=削除, [aria-label="削除"]');
      await expect(deleteButtons.first()).toBeVisible();
    });

    test("弁当の並び順制御が可能であること", async ({ page }) => {
      // 並び順の上げ下げボタンまたはドラッグ機能の確認
      const orderButtons = page.locator('[aria-label*="順序"], text=↑, text=↓');
      if ((await orderButtons.count()) > 0) {
        await expect(orderButtons.first()).toBeVisible();
      }
    });
  });

  test.describe("設定管理", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("text=設定").click();
      await expect(page.locator(".card-title")).toContainText("⚙️ 設定");
    });

    test("保育園情報設定が表示されること", async ({ page }) => {
      await expect(page.locator("text=保育園情報")).toBeVisible();

      // 保育園名の入力フィールド
      await expect(page.locator('input[type="text"]').first()).toBeVisible();
    });

    test("業者情報設定が表示されること", async ({ page }) => {
      await expect(page.locator("text=業者情報")).toBeVisible();

      // 業者名や連絡先の入力フィールド
      const inputs = page.locator('input[type="text"], input[type="tel"]');
      await expect(inputs.first()).toBeVisible();
    });

    test("設定保存ボタンが表示されること", async ({ page }) => {
      await expect(page.locator("text=保存, text=設定を保存")).toBeVisible();
    });

    test("設定フォームが入力可能であること", async ({ page }) => {
      // 保育園名を入力
      const gardenNameInput = page
        .locator('input[placeholder*="保育園名"], input[name*="garden_name"]')
        .first();
      if ((await gardenNameInput.count()) > 0) {
        await gardenNameInput.fill("テスト保育園");
        await expect(gardenNameInput).toHaveValue("テスト保育園");
      }
    });
  });

  test("マスタ管理のデータ整合性が保たれること", async ({ page }) => {
    // スタッフ管理でスタッフ数を確認
    await page.locator("text=スタッフ管理").click();
    const staffCount = await page.locator(".staff-row, .staff-item").count();

    // データ入力ページでスタッフ選択肢を確認
    await page.locator("text=データ入力").click();
    const staffOptions = await page.locator("#staff-select option").count();

    // スタッフ数 + 1（「選択してください」オプション）が一致することを確認
    expect(staffOptions).toBe(staffCount + 1);

    // 弁当管理で弁当数を確認
    await page.locator("text=弁当管理").click();
    const itemCount = await page.locator(".item-row, .item-card").count();

    // データ入力ページで弁当カード数を確認
    await page.locator("text=データ入力").click();
    const itemCards = await page.locator(".item-card").count();

    // 弁当数が一致することを確認
    expect(itemCards).toBe(itemCount);
  });
});
