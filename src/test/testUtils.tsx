import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AppContextProvider } from "../renderer/contexts/AppContext";

// テスト用のプロバイダー
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <AppContextProvider>{children}</AppContextProvider>;
};

// カスタムレンダー関数
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// createCustomRender関数を追加
export const createCustomRender = () => customRender;

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// テスト用のモックデータ
export const mockStaff = [
  { id: 1, name: "テストスタッフ1", is_active: 1, display_order: 1 },
  { id: 2, name: "テストスタッフ2", is_active: 1, display_order: 2 },
];

export const mockItems = [
  { id: 1, name: "テスト弁当1", price: 500, is_active: 1, display_order: 1 },
  { id: 2, name: "テスト弁当2", price: 600, is_active: 1, display_order: 2 },
];

export const mockOrderViews = [
  {
    id: 1,
    order_date: "2025-07-01",
    user_name: "テストスタッフ1",
    item_name: "テスト弁当1",
    quantity: 1,
    price: 500,
    total_price: 500,
    status: "open",
  },
];

export const mockSettings = {
  garden_name: "テスト保育園",
  garden_address: "テスト住所",
  supplier_name: "テスト業者",
  supplier_address: "テスト業者住所",
  supplier_phone: "03-1234-5678",
};

export const mockMonthlyReport = {
  month: "2025-07",
  staff_totals: [
    { staff_name: "テストスタッフ1", total_amount: 5000 },
    { staff_name: "テストスタッフ2", total_amount: 3000 },
  ],
  grand_total: 8000,
  is_locked: false,
};

export const mockWeeklyReport = {
  week_start: "2025-07-01",
  week_end: "2025-07-07",
  items: {
    テスト弁当1: {
      月: 5,
      火: 3,
      水: 4,
      木: 2,
      金: 6,
    },
  },
  totals: {
    月: 5,
    火: 3,
    水: 4,
    木: 2,
    金: 6,
  },
};
