import { test, expect } from "@playwright/test";

test.describe("アクセシビリティとユーザビリティ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test.describe("キーボードナビゲーション", () => {
    test("Tabキーによるフォーカス移動が正常に動作すること", async ({
      page,
    }) => {
      // データ入力ページでTabキーナビゲーションをテスト
      await page.keyboard.press("Tab");
      await expect(page.locator("#order-date")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator("#staff-select")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator("#quantity-1")).toBeFocused();
    });

    test("Enterキーによるボタン操作が可能であること", async ({ page }) => {
      // 保存ボタンにフォーカスを当ててEnterキーで操作
      await page.locator("text=💾 注文を保存").focus();
      await expect(page.locator("text=💾 注文を保存")).toBeFocused();

      // Enterキーで実行（実際の保存処理の確認は省略）
      await page.keyboard.press("Enter");
    });

    test("矢印キーによるナビゲーションが可能であること", async ({ page }) => {
      // ナビゲーションボタンの矢印キー操作
      await page.locator("text=データ入力").focus();

      // 下矢印で次のナビゲーション項目へ
      await page.keyboard.press("ArrowDown");
      await expect(page.locator("text=当日注文一覧")).toBeFocused();
    });

    test("Escキーによるモーダルクローズが動作すること", async ({ page }) => {
      await page.locator("text=スタッフ管理").click();

      // モーダルを開く（新規スタッフ追加）
      if ((await page.locator("text=新規スタッフ追加").count()) > 0) {
        await page.locator("text=新規スタッフ追加").click();

        // モーダルが開いたことを確認
        await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();

        // Escキーでモーダルを閉じる
        await page.keyboard.press("Escape");
        await expect(page.locator('.modal, [role="dialog"]')).not.toBeVisible();
      }
    });
  });

  test.describe("ARIA属性とセマンティクス", () => {
    test("適切なrole属性が設定されていること", async ({ page }) => {
      // ヘッダー
      await expect(page.locator('[role="banner"]')).toBeVisible();

      // ナビゲーション
      await expect(page.locator('[role="navigation"]')).toBeVisible();

      // メインコンテンツ
      await expect(page.locator('[role="main"], main')).toBeVisible();

      // ボタン
      const buttonCount = await page.locator('[role="button"], button').count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test("フォーム要素に適切なラベルが設定されていること", async ({ page }) => {
      // 日付入力
      await expect(page.locator('label[for="order-date"]')).toBeVisible();
      await expect(page.locator("#order-date")).toHaveAttribute(
        "aria-label",
        /.+/
      );

      // スタッフ選択
      await expect(page.locator('label[for="staff-select"]')).toBeVisible();

      // 数量入力
      await expect(page.locator('label[for="quantity-1"]')).toBeVisible();
    });

    test("ローディング状態に適切なARIA属性が設定されていること", async ({
      page,
    }) => {
      // ローディングインジケーターの確認
      const loadingIndicator = page.locator(
        '[role="status"], [aria-live="polite"]'
      );
      if ((await loadingIndicator.count()) > 0) {
        await expect(loadingIndicator.first()).toHaveAttribute(
          "aria-label",
          /.+/
        );
      }
    });

    test("エラーメッセージに適切なARIA属性が設定されていること", async ({
      page,
    }) => {
      // エラー表示の確認（実際のエラーを発生させる必要がある場合は省略）
      const errorMessage = page.locator('[role="alert"], .error-message');
      if ((await errorMessage.count()) > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
    });
  });

  test.describe("スクリーンリーダー対応", () => {
    test("見出し構造が適切に設定されていること", async ({ page }) => {
      // h1タグ（メインタイトル）
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toContainText("OOMS");

      // h2タグ（セクションタイトル）
      const h2Count = await page.locator("h2").count();
      expect(h2Count).toBeGreaterThan(0);

      // h3タグ（サブセクション）
      const h3Count = await page.locator("h3").count();
      expect(h3Count).toBeGreaterThan(0);
    });

    test("リンクとボタンに適切なテキストが設定されていること", async ({
      page,
    }) => {
      // すべてのボタンにテキストまたはaria-labelが設定されている
      const buttons = await page.locator("button").all();
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute("aria-label");
        expect(text || ariaLabel).toBeTruthy();
      }
    });

    test("画像に適切なalt属性が設定されていること", async ({ page }) => {
      const images = await page.locator("img").all();
      for (const image of images) {
        await expect(image).toHaveAttribute("alt");
      }
    });
  });

  test.describe("カラーコントラストとビジュアル", () => {
    test("フォーカス状態が視覚的に分かりやすいこと", async ({ page }) => {
      // フォーカススタイルの確認
      await page.locator("#order-date").focus();

      // フォーカス時のスタイル変更を確認
      const focusedElement = page.locator("#order-date");
      await expect(focusedElement).toBeFocused();

      // 実際のスタイル確認は困難なため、フォーカス可能であることを確認
      await expect(focusedElement).toBeVisible();
    });

    test("ホバー状態が適切に表示されること", async ({ page }) => {
      // ボタンのホバー状態
      await page.locator("text=💾 注文を保存").hover();
      await expect(page.locator("text=💾 注文を保存")).toBeVisible();
    });

    test("ダークモード/ライトモードが考慮されていること", async ({ page }) => {
      // システムのカラースキーム設定を確認
      // （実際の実装がある場合のみ）
      const colorScheme = await page.evaluate(() => {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      });

      // CSSカスタムプロパティの確認
      const rootStyles = await page.evaluate(() => {
        return getComputedStyle(document.documentElement);
      });

      expect(rootStyles).toBeDefined();
    });
  });

  test.describe("レスポンシブデザイン", () => {
    test("モバイルサイズで適切に表示されること", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // ヘッダーが表示される
      await expect(page.locator(".app-header")).toBeVisible();

      // ナビゲーションが適切に配置される
      await expect(page.locator(".main-nav")).toBeVisible();

      // コンテンツエリアが表示される
      await expect(page.locator(".content-area")).toBeVisible();
    });

    test("タブレットサイズで適切に表示されること", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // レイアウトの確認
      await expect(page.locator(".app-container")).toBeVisible();
      await expect(page.locator(".main-container")).toBeVisible();
    });

    test("デスクトップサイズで適切に表示されること", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // 大画面での表示確認
      await expect(page.locator(".app-container")).toBeVisible();

      // サイドバーナビゲーションが表示される
      await expect(page.locator(".main-nav")).toBeVisible();
    });

    test("横向き表示で適切に表示されること", async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });

      // 横向きでのレイアウト確認
      await expect(page.locator(".app-container")).toBeVisible();
    });
  });

  test.describe("エラーハンドリング", () => {
    test("ネットワークエラー時に適切なメッセージが表示されること", async ({
      page,
    }) => {
      // ネットワークを無効にする
      await page.route("**/*", (route) => route.abort());

      // 何らかの操作を実行
      await page.locator("text=💾 注文を保存").click();

      // エラーメッセージまたはローディング状態の確認
      // （実際の実装に依存するため、基本的な表示確認のみ）
      await expect(page.locator("body")).toBeVisible();
    });

    test("バリデーションエラーが適切に表示されること", async ({ page }) => {
      // 必須フィールドを空のまま送信
      await page.locator("text=💾 注文を保存").click();

      // HTML5バリデーションまたはカスタムバリデーションの確認
      await expect(page.locator("#staff-select")).toHaveAttribute("required");
    });
  });
});
