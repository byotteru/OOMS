import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { createCustomRender } from "../test/testUtils";

const customRender = createCustomRender();

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders main application component", () => {
    customRender(<App />);
    const linkElements = screen.getAllByText("OOMS - お弁当注文管理システム");
    expect(linkElements[0]).toBeInTheDocument();

    // アプリケーションの基本構造も確認（最初のヘッダーを取得）
    const headers = screen.getAllByRole("banner");
    expect(headers[0]).toBeInTheDocument();
  });
});
