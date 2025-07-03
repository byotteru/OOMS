import { Page } from "@playwright/test";

/**
 * E2Eテスト用のヘルパー関数
 */

/**
 * 指定された期間待機する
 */
export async function waitForTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ページが完全に読み込まれるまで待機
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * データ入力フォームに値を設定する
 */
export async function fillDataEntryForm(
  page: Page,
  data: {
    date?: string;
    staffId?: string;
    quantities?: { [itemId: string]: string };
    remarks?: { [itemId: string]: string };
  }
): Promise<void> {
  if (data.date) {
    await page.locator("#order-date").fill(data.date);
  }

  if (data.staffId) {
    await page.locator("#staff-select").selectOption(data.staffId);
  }

  if (data.quantities) {
    for (const [itemId, quantity] of Object.entries(data.quantities)) {
      await page.locator(`#quantity-${itemId}`).fill(quantity);
    }
  }

  if (data.remarks) {
    for (const [itemId, remark] of Object.entries(data.remarks)) {
      await page.locator(`#remarks-${itemId}`).fill(remark);
    }
  }
}

/**
 * ナビゲーションでページを切り替える
 */
export async function navigateToPage(
  page: Page,
  pageName: string
): Promise<void> {
  await page.locator(`text=${pageName}`).click();

  // ページが切り替わるまで少し待機
  await waitForTimeout(500);
}

/**
 * モーダルが開くまで待機
 */
export async function waitForModal(page: Page): Promise<void> {
  await page.waitForSelector('.modal, [role="dialog"]', { state: "visible" });
}

/**
 * モーダルが閉じるまで待機
 */
export async function waitForModalClose(page: Page): Promise<void> {
  await page.waitForSelector('.modal, [role="dialog"]', { state: "hidden" });
}

/**
 * ローディングが完了するまで待機
 */
export async function waitForLoading(page: Page): Promise<void> {
  // ローディングインジケーターが表示される
  await page
    .waitForSelector(".loading-indicator", { state: "visible", timeout: 1000 })
    .catch(() => {});

  // ローディングインジケーターが非表示になる
  await page
    .waitForSelector(".loading-indicator", { state: "hidden", timeout: 10000 })
    .catch(() => {});
}

/**
 * エラーメッセージが表示されているかチェック
 */
export async function checkForErrors(page: Page): Promise<string[]> {
  const errorElements = await page
    .locator('.error-message, [role="alert"]')
    .all();
  const errors: string[] = [];

  for (const element of errorElements) {
    const text = await element.textContent();
    if (text) {
      errors.push(text.trim());
    }
  }

  return errors;
}

/**
 * スクリーンショットを撮影（デバッグ用）
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `e2e-screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * テーブルの行数を取得
 */
export async function getTableRowCount(
  page: Page,
  tableSelector: string
): Promise<number> {
  return await page
    .locator(`${tableSelector} tbody tr, ${tableSelector} .table-row`)
    .count();
}

/**
 * セレクトボックスのオプション数を取得
 */
export async function getSelectOptionCount(
  page: Page,
  selectSelector: string
): Promise<number> {
  return await page.locator(`${selectSelector} option`).count();
}

/**
 * フォームの値をクリア
 */
export async function clearForm(page: Page): Promise<void> {
  // クリアボタンがある場合はクリック
  const clearButton = page.locator("text=🗑️ クリア, text=クリア");
  if ((await clearButton.count()) > 0) {
    await clearButton.click();
  } else {
    // 手動でフォーム要素をクリア
    await page.locator("#staff-select").selectOption("");

    const quantityInputs = await page.locator('input[type="number"]').all();
    for (const input of quantityInputs) {
      await input.fill("0");
    }

    const textInputs = await page.locator('input[type="text"]').all();
    for (const input of textInputs) {
      await input.fill("");
    }
  }
}

/**
 * アプリケーションの基本状態を確認
 */
export async function checkBasicAppState(page: Page): Promise<void> {
  // ヘッダーが表示されている
  await page.waitForSelector(".app-header", { state: "visible" });

  // ナビゲーションが表示されている
  await page.waitForSelector(".main-nav", { state: "visible" });

  // メインコンテンツが表示されている
  await page.waitForSelector(".content-area", { state: "visible" });
}

/**
 * 日付文字列をフォーマット（YYYY-MM-DD）
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * 今日の日付を取得
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * 指定日数後の日付を取得
 */
export function getDateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}
