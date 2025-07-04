import "@testing-library/jest-dom";
import { vi } from "vitest";
import { EventEmitter } from "events";

// bcryptモックの統一設定
vi.mock("bcrypt", () => ({
  hashSync: vi.fn(
    (password: string, _saltRounds: number) => `hashed_${password}`
  ),
  compareSync: vi.fn(
    (password: string, hash: string) => hash === `hashed_${password}`
  ),
  hash: vi.fn((password: string, _saltRounds: number) =>
    Promise.resolve(`hashed_${password}`)
  ),
  compare: vi.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
}));

// Unhandled Error/Rejectionのハンドリング
process.on("unhandledRejection", (reason, promise) => {
  console.warn("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.warn("Uncaught Exception:", error);
});

// グローバルエラーハンドラー
window.addEventListener("error", (event) => {
  console.warn("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.warn("Unhandled promise rejection:", event.reason);
  event.preventDefault(); // テストが落ちないようにする
});

// テスト用モックデータ
const mockUsers = [
  {
    id: 1,
    name: "テストスタッフ1",
    email: "staff1@ooms.local",
    role_id: 2,
    is_active: 1,
    display_order: 1,
  },
  {
    id: 2,
    name: "テストスタッフ2",
    email: "staff2@ooms.local",
    role_id: 2,
    is_active: 1,
    display_order: 2,
  },
];

const mockStaff = [
  { id: 1, name: "テストスタッフ1", is_active: 1, display_order: 1 },
  { id: 2, name: "テストスタッフ2", is_active: 1, display_order: 2 },
];

const mockItems = [
  { id: 1, name: "テスト弁当1", price: 500, is_active: 1, display_order: 1 },
  { id: 2, name: "テスト弁当2", price: 600, is_active: 1, display_order: 2 },
];

const mockSettings = {
  garden_name: "テスト保育園",
  garden_address: "テスト住所",
  supplier_name: "テスト業者",
  supplier_address: "テスト業者住所",
  supplier_phone: "03-1234-5678",
};

// Window.api APIのモック
global.window.api = {
  // 認証関連
  login: vi.fn().mockResolvedValue({ id: 1, username: "test" }),
  getCurrentUser: vi.fn().mockResolvedValue({ id: 1, username: "test" }),

  // ユーザー管理
  getUsers: vi.fn().mockResolvedValue(mockUsers),
  addUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
  deleteUser: vi.fn().mockResolvedValue(undefined),

  // スタッフ関連（後方互換性）
  getStaff: vi.fn().mockResolvedValue(mockStaff),
  addStaff: vi.fn().mockResolvedValue(undefined),
  updateStaff: vi.fn().mockResolvedValue(undefined),
  deleteStaff: vi.fn().mockResolvedValue(undefined),

  // 弁当関連
  getItems: vi.fn().mockResolvedValue(mockItems),
  addItem: vi.fn().mockResolvedValue(undefined),
  updateItem: vi.fn().mockResolvedValue(undefined),
  deleteItem: vi.fn().mockResolvedValue(undefined),

  // 注文関連
  getOrdersByDate: vi.fn().mockResolvedValue([]),
  getOrdersByUser: vi.fn().mockResolvedValue([]),
  getOrdersForWeek: vi.fn().mockResolvedValue([]),
  addOrder: vi.fn().mockResolvedValue(undefined),
  cancelOrder: vi.fn().mockResolvedValue(undefined),
  deleteOrder: vi.fn().mockResolvedValue(undefined),
  saveWeeklyOrders: vi.fn().mockResolvedValue(undefined),

  // 注文ロック関連
  lockOrders: vi.fn().mockResolvedValue({ success: true }),
  unlockOrders: vi.fn().mockResolvedValue({ success: true }),

  // レポート関連
  getWeeklyReport: vi.fn().mockResolvedValue({
    week_start: "2025-07-01",
    week_end: "2025-07-07",
    startDate: "2025-07-01",
    endDate: "2025-07-07",
    items: { テスト弁当1: { 月: 1, 火: 2, 水: 3, 木: 4, 金: 5 } },
    totals: { 月: 1, 火: 2, 水: 3, 木: 4, 金: 5 },
    totalSummary: [
      { item_name: "テスト弁当1", total_quantity: 15 },
      { item_name: "テスト弁当2", total_quantity: 10 },
    ],
    days: [
      {
        date: "2025-07-01",
        items: [{ item_name: "テスト弁当1", quantity: 1 }],
      },
      {
        date: "2025-07-02",
        items: [{ item_name: "テスト弁当1", quantity: 2 }],
      },
      {
        date: "2025-07-03",
        items: [{ item_name: "テスト弁当1", quantity: 3 }],
      },
      {
        date: "2025-07-04",
        items: [{ item_name: "テスト弁当1", quantity: 4 }],
      },
      {
        date: "2025-07-05",
        items: [{ item_name: "テスト弁当1", quantity: 5 }],
      },
      { date: "2025-07-06", items: [] },
      { date: "2025-07-07", items: [] },
    ],
  }),
  getMonthlyReport: vi.fn().mockResolvedValue({
    month: "2025-07",
    staff_totals: [
      { staff_name: "テストスタッフ1", total_amount: 5000 },
      { staff_name: "テストスタッフ2", total_amount: 3000 },
    ],
    grand_total: 8000,
    is_locked: false,
  }),

  // 月次締め処理
  lockMonth: vi.fn().mockResolvedValue(undefined),

  // 監査ログ
  getAuditLogs: vi.fn().mockResolvedValue([]),

  // 設定関連
  getSettings: vi.fn().mockResolvedValue(mockSettings),
  saveSettings: vi.fn().mockResolvedValue(undefined),

  // ユーティリティ
  showErrorDialog: vi.fn().mockResolvedValue(undefined),
  showInfoDialog: vi.fn().mockResolvedValue(undefined),
  exportCSV: vi.fn().mockResolvedValue(undefined),
};

// グローバルalert関数のモック
global.alert = vi.fn();

// グローバルconfirm関数のモック
global.confirm = vi.fn(() => true);

// console.log の出力を抑制（テスト実行時の見通しを良くする）
global.console = {
  ...console,
  // データベース初期化の重要なログは残しつつ、冗長なログを抑制
  log: vi.fn((message, ...args) => {
    // デバッグテスト時は全てのログを表示
    if (typeof message === "string" && message.includes("=== ")) {
      console.info(message, ...args);
      return;
    }
    // testUser, testItem などのデバッグ出力を表示
    if (
      typeof message === "string" &&
      (message.includes("testUser:") ||
        message.includes("testItem:") ||
        message.includes("保存前の") ||
        message.includes("保存後の") ||
        message.includes("結果:") ||
        message.includes("手動"))
    ) {
      console.info(message, ...args);
      return;
    }
    if (
      typeof message === "string" &&
      (message.includes("DatabaseManager: Creating new instance") ||
        message.includes("データベースに接続しました") ||
        message.includes("DatabaseManager: Starting table creation") ||
        message.includes("DatabaseManager: Tables created successfully"))
    ) {
      // 重複するDBログは抑制
      return;
    }
    console.info(message, ...args);
  }),
  warn: console.warn, // 警告は表示
  error: console.error, // エラーは表示
};

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// matchMediaのモック
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// メモリリーク警告を抑制
EventEmitter.defaultMaxListeners = 20;
