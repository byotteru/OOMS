import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["line"]],
  timeout: 30000,
  use: {
    baseURL: "http://localhost:8080",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node e2e/mock-api-server.js",
    port: 8080,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "validation",
      testMatch: ["build-validation.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "app-tests",
      testMatch: ["app.spec.ts", "navigation.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
