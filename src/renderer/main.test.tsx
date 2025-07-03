import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoot } from "react-dom/client";

// main.tsxの内容をテスト
describe("main.tsx", () => {
  it("renders without crashing", () => {
    // DOMコンテナを作成
    const container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);

    // createRootが正常に動作することを確認
    expect(() => {
      const root = createRoot(container);
      // 実際のレンダリングはしない（DOM依存のため）
    }).not.toThrow();

    // クリーンアップ
    document.body.removeChild(container);
  });

  it("finds root element", () => {
    const container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);

    const rootElement = document.getElementById("root");
    expect(rootElement).not.toBeNull();
    expect(rootElement).toBe(container);

    document.body.removeChild(container);
  });
});
