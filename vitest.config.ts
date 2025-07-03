import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "out",
      "dist-electron",
      "src/main/preload.test.ts",
    ],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: false, // 分離を無効にしてパフォーマンス向上
      },
    },
    testTimeout: 10000,
    silent: false,
    logHeapUsage: true,
    // 並列テストを制限してDB競合を回避
    maxConcurrency: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "out/",
        "dist-electron/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@main": path.resolve(__dirname, "./src/main"),
      "@renderer": path.resolve(__dirname, "./src/renderer"),
      "@test": path.resolve(__dirname, "./src/test"),
    },
  },
});
