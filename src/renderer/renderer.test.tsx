import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { AppContextProvider } from "./contexts/AppContext";

// AppContextProvider内でレンダリングするためのカスタムレンダー関数
const renderWithContext = (ui: React.ReactElement) => {
  return render(<AppContextProvider>{ui}</AppContextProvider>);
};

describe("Renderer", () => {
  beforeEach(() => {
    // モックをクリア
    vi.clearAllMocks();
    // window.apiの基本的なモックを再設定
    window.api = {
      getUsers: vi.fn().mockResolvedValue([]),
      getItems: vi.fn().mockResolvedValue([]),
      getSettings: vi.fn().mockResolvedValue({}),
      // 他の必要なAPIもモック化
      getStaff: vi.fn().mockResolvedValue([]),
      getOrdersByDate: vi.fn().mockResolvedValue([]),
      getWeeklyReport: vi.fn().mockResolvedValue({ days: [], totalSummary: [] }),
      getMonthlyReport: vi.fn().mockResolvedValue({ staff_totals: [], grand_total: 0 }),
      saveWeeklyOrders: vi.fn().mockResolvedValue({ success: true }),
    } as any;
  });

  it("renders the app without crashing", () => {
    renderWithContext(<App />);
    // ヘッダーのタイトルを検索
    const titleElements = screen.getAllByText("OOMS - お弁当注文管理システム");
    expect(titleElements[0]).toBeInTheDocument();

    // ヘッダーの存在確認
    const headers = screen.getAllByRole("banner");
    expect(headers.length).toBeGreaterThan(0);
  });
});