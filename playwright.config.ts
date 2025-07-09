import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true, // 並列実行を有効化
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // CI環境ではリトライを実行
  workers: process.env.CI ? 1 : undefined, // CI環境ではワーカーを1に制限
  reporter: "html", // レポート形式をhtmlに変更
  timeout: 60000,
  expect: {
    timeout: 10000, // expectのタイムアウトを10秒に設定
  },
  use: {
    trace: "on-first-retry", // 最初の再試行でのみトレースを記録
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "electron-app",
      testMatch: /.*\.spec\.ts/,
    },
  ],
});