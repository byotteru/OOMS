import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test.describe("OOMS Build Validation", () => {
  test("ビルドファイルが正常に生成されていること", async () => {
    const outDir = path.join(process.cwd(), "out");

    // メインプロセスファイルの確認
    const mainIndexPath = path.join(outDir, "main", "index.js");
    expect(fs.existsSync(mainIndexPath)).toBe(true);

    // プリロードファイルの確認
    const preloadIndexPath = path.join(outDir, "preload", "index.js");
    expect(fs.existsSync(preloadIndexPath)).toBe(true);

    // レンダラーファイルの確認
    const rendererIndexPath = path.join(outDir, "renderer", "index.html");
    expect(fs.existsSync(rendererIndexPath)).toBe(true);

    // CSSファイルの確認
    const rendererDir = path.join(outDir, "renderer");
    const assetsDir = path.join(rendererDir, "assets");

    if (fs.existsSync(assetsDir)) {
      const assetFiles = fs.readdirSync(assetsDir);
      const cssFiles = assetFiles.filter((file) => file.endsWith(".css"));
      expect(cssFiles.length).toBeGreaterThan(0);

      // JSファイルの確認
      const jsFiles = assetFiles.filter((file) => file.endsWith(".js"));
      expect(jsFiles.length).toBeGreaterThan(0);
    } else {
      const files = fs.readdirSync(rendererDir);
      const cssFiles = files.filter((file) => file.endsWith(".css"));
      expect(cssFiles.length).toBeGreaterThan(0);

      // JSファイルの確認
      const jsFiles = files.filter((file) => file.endsWith(".js"));
      expect(jsFiles.length).toBeGreaterThan(0);
    }

    console.log("✅ All build files exist");
  });

  test("HTMLファイルが正しい構造を持っていること", async () => {
    const rendererPath = path.join(
      process.cwd(),
      "out",
      "renderer",
      "index.html"
    );
    const htmlContent = fs.readFileSync(rendererPath, "utf-8");

    // 基本的なHTML構造の確認
    expect(htmlContent).toContain("<!DOCTYPE html>");
    expect(htmlContent).toContain("<html");
    expect(htmlContent).toContain("<head>");
    expect(htmlContent).toContain("<body>");
    expect(htmlContent).toContain('<div id="root">');

    // スクリプトとCSSの読み込み確認
    expect(htmlContent).toContain(".css");
    expect(htmlContent).toContain(".js");

    console.log("✅ HTML structure validation passed");
  });

  test("JavaScriptファイルが正常に生成されていること", async () => {
    const rendererDir = path.join(process.cwd(), "out", "renderer");
    const assetsDir = path.join(rendererDir, "assets");

    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const jsFiles = files.filter((file) => file.endsWith(".js"));

      expect(jsFiles.length).toBeGreaterThan(0);

      // 最初のJSファイルの内容確認
      const jsFilePath = path.join(assetsDir, jsFiles[0]);
      const jsContent = fs.readFileSync(jsFilePath, "utf-8");

      // Reactの痕跡があることを確認
      expect(jsContent.length).toBeGreaterThan(1000);
    } else {
      const files = fs.readdirSync(rendererDir);
      const jsFiles = files.filter((file) => file.endsWith(".js"));
      expect(jsFiles.length).toBeGreaterThan(0);
    }

    console.log("✅ JavaScript files validation passed");
  });

  test("CSSファイルが正常に生成されていること", async () => {
    const rendererDir = path.join(process.cwd(), "out", "renderer");
    const assetsDir = path.join(rendererDir, "assets");

    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const cssFiles = files.filter((file) => file.endsWith(".css"));

      expect(cssFiles.length).toBeGreaterThan(0);

      // 最初のCSSファイルの内容確認
      const cssFilePath = path.join(assetsDir, cssFiles[0]);
      const cssContent = fs.readFileSync(cssFilePath, "utf-8");
      expect(cssContent.length).toBeGreaterThan(100);
    } else {
      const files = fs.readdirSync(rendererDir);
      const cssFiles = files.filter((file) => file.endsWith(".css"));
      expect(cssFiles.length).toBeGreaterThan(0);
    }

    console.log("✅ CSS files validation passed");
  });

  test("package.jsonの設定が正しいこと", async () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // 必要なスクリプトが存在すること
    expect(packageJson.scripts).toHaveProperty("build");
    expect(packageJson.scripts).toHaveProperty("test");
    expect(packageJson.scripts).toHaveProperty("dev");
    expect(packageJson.scripts).toHaveProperty("start");

    // 必要な依存関係が存在すること
    expect(packageJson.devDependencies).toHaveProperty("@playwright/test");
    expect(packageJson.devDependencies).toHaveProperty("vitest");
    expect(packageJson.devDependencies).toHaveProperty("electron");

    // Electronの設定が正しいこと
    expect(packageJson.main).toBe("out/main/index.js");

    console.log("✅ Package.json validation passed");
  });

  test("ファイルサイズが適切であること", async () => {
    const outDir = path.join(process.cwd(), "out");

    // メインプロセスファイルのサイズ確認
    const mainIndexPath = path.join(outDir, "main", "index.js");
    const mainStats = fs.statSync(mainIndexPath);
    expect(mainStats.size).toBeGreaterThan(1000); // 最小サイズ
    expect(mainStats.size).toBeLessThan(1000000); // 最大サイズ（1MB）

    // レンダラーファイルのサイズ確認
    const rendererDir = path.join(outDir, "renderer");
    const jsFiles = fs
      .readdirSync(rendererDir)
      .filter((file) => file.endsWith(".js"));

    if (jsFiles.length > 0) {
      const jsFilePath = path.join(rendererDir, jsFiles[0]);
      const jsStats = fs.statSync(jsFilePath);
      expect(jsStats.size).toBeGreaterThan(10000); // 最小サイズ
      expect(jsStats.size).toBeLessThan(10000000); // 最大サイズ（10MB）
    }

    console.log("✅ File size validation passed");
  });
});
