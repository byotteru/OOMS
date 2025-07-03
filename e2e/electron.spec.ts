import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";

test.describe("Electron App E2E Tests", () => {
  test("Electronアプリケーションが起動すること", async () => {
    // Electronアプリを起動
    const electronApp = await electron.launch({
      args: [path.join(__dirname, "../out/main/index.js")],
    });

    // メインウィンドウを取得
    const window = await electronApp.firstWindow();

    // ウィンドウが表示されることを確認
    await expect(window).toBeTruthy();

    // タイトルを確認
    const title = await window.title();
    expect(title).toContain("OOMS");

    // アプリケーションを終了
    await electronApp.close();
  });

  test("Electronアプリの基本機能が動作すること", async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, "../out/main/index.js")],
    });

    const window = await electronApp.firstWindow();

    // アプリケーションタイトルの確認
    await expect(window.locator("h1")).toContainText(
      "OOMS - お弁当注文管理システム"
    );

    // ナビゲーションの確認
    await expect(window.locator(".main-nav")).toBeVisible();

    // データ入力フォームの確認
    await expect(window.locator("#order-date")).toBeVisible();
    await expect(window.locator("#staff-select")).toBeVisible();

    // ナビゲーションテスト
    await window.locator("text=スタッフ管理").click();
    await expect(window.locator(".card-title")).toContainText(
      "👥 スタッフ管理"
    );

    await electronApp.close();
  });

  test("Electronアプリのウィンドウサイズが適切であること", async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, "../out/main/index.js")],
    });

    const window = await electronApp.firstWindow();

    // ウィンドウサイズを確認
    const windowSize = await window.evaluate(() => ({
      width: globalThis.innerWidth,
      height: globalThis.innerHeight,
    }));

    // 最小サイズを確認（実際の設定値に依存）
    expect(windowSize.width).toBeGreaterThan(800);
    expect(windowSize.height).toBeGreaterThan(600);

    await electronApp.close();
  });

  test("メニューバーが適切に設定されていること", async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, "../out/main/index.js")],
    });

    // メニューの確認（実際のメニュー実装がある場合）
    const menu = await electronApp.evaluate(({ app }) => {
      const menu = app.applicationMenu;
      return menu ? menu.items.map((item) => item.label) : [];
    });

    // メニューが存在する場合の確認
    if (menu.length > 0) {
      expect(menu).toContain("File");
    }

    await electronApp.close();
  });
});
