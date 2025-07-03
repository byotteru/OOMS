import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";

// Window.apiモックの設定
const mockApi = {
  isReady: true,
  getStaff: vi.fn(),
  getItems: vi.fn(),
  getSettings: vi.fn(),
};

Object.defineProperty(window, "api", {
  value: mockApi,
  writable: true,
});

describe("Renderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getStaff.mockResolvedValue([]);
    mockApi.getItems.mockResolvedValue([]);
    mockApi.getSettings.mockResolvedValue({});
  });

  it("renders the app without crashing", () => {
    render(<App />);
    // ヘッダーの最初のタイトルを検索（複数存在する場合は最初のものを取得）
    const titleElements = screen.getAllByText("OOMS - お弁当注文管理システム");
    expect(titleElements[0]).toBeInTheDocument();

    // 複数のヘッダーが存在する場合を考慮してgetAllByRoleを使用
    const headers = screen.getAllByRole("banner");
    expect(headers.length).toBeGreaterThan(0);
  });
});
