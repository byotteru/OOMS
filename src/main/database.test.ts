import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DatabaseManager } from "./database";

// better-sqlite3 のモック
const mockStatement = {
  run: vi.fn(),
  get: vi.fn(),
  all: vi.fn(),
};

interface MockStatement {
  run: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
}

interface MockDatabase {
  prepare: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
  pragma: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

const mockDb: MockDatabase = {
  prepare: vi.fn().mockReturnValue(mockStatement),
  // transactionは、渡された関数を実行する関数を返すように修正
  transaction: vi.fn(
    (fn: (...args: any[]) => any) =>
      (...args: any[]) =>
        fn(...args)
  ),
  exec: vi.fn(),
  pragma: vi.fn(),
  close: vi.fn(),
};

vi.mock("better-sqlite3", () => ({
  default: vi.fn(() => mockDb),
}));

// bcryptのモック
vi.mock("bcrypt", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
  compare: vi.fn().mockResolvedValue(true),
  hashSync: vi.fn().mockReturnValue("hashed_password"),
  compareSync: vi.fn().mockReturnValue(true),
}));

describe("DatabaseManager", () => {
  let db: DatabaseManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // モックのデフォルトの戻り値を設定
    mockStatement.get.mockReturnValue(undefined);
    mockStatement.all.mockReturnValue([]);
    mockStatement.run.mockReturnValue({ changes: 1, lastInsertRowid: 1 });

    // 初期化時に呼ばれるクエリのモック
    mockDb.prepare.mockImplementation((sql: string) => {
      if (sql.includes("SELECT COUNT(*)")) {
        // .get()が呼ばれたときにオブジェクトを返すようにする
        const statementWithGet = {
          ...mockStatement,
          get: vi.fn().mockReturnValue({ count: 0 }),
        };
        return statementWithGet;
      }
      if (sql.includes("SELECT * FROM staff")) {
        const statementWithAll = {
          ...mockStatement,
          all: vi.fn().mockReturnValue([]),
        };
        return statementWithAll;
      }
      return mockStatement;
    });

    db = DatabaseManager.getInstance(":memory:");
  });

  afterEach(() => {
    DatabaseManager.resetInstance();
  });

  describe("スタッフ管理", () => {
    it("スタッフリストを取得できる", () => {
      mockStatement.all.mockReturnValue([{ id: 1, name: "Test Staff" }]);
      const staff = db.getStaff();
      expect(Array.isArray(staff)).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, name, is_active, display_order FROM users"
        )
      );
    });

    it("スタッフを追加できる", () => {
      expect(() => db.addStaff("テストスタッフ", 1)).not.toThrow();
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users")
      );
    });
  });

  describe("弁当管理", () => {
    it("弁当リストを取得できる", () => {
      db.getItems();
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM items")
      );
    });

    it("弁当を追加できる", () => {
      expect(() => db.addItem("テスト弁当", 500, 1)).not.toThrow();
    });
  });

  describe("注文管理", () => {
    it("注文を追加できる", () => {
      const orderData = {
        order_date: "2025-07-01",
        user_id: 1,
        items: [{ item_id: 1, quantity: 1 }],
      };
      // addOrderは同期なので.resolvesは不要
      expect(() => db.addOrder(orderData)).not.toThrow();
      // transactionが呼ばれたことを確認
      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });

  describe("ユーザー管理", () => {
    it("ユーザーを追加できる", async () => {
      // addUserは非同期なのでawaitと.resolvesが必要
      await expect(
        db.addUser("テストユーザー", "test@example.com", "password", 2)
      ).resolves.not.toThrow();
    });

    it("現在のユーザーを取得できる", () => {
      mockStatement.get.mockReturnValue({ id: 1, name: "Test User" });
      const user = db.getCurrentUser(1);
      expect(user).toBeDefined();
    });

    it("現在のユーザーが見つからない場合にエラーをスローする", () => {
      mockStatement.get.mockReturnValue(undefined);
      expect(() => db.getCurrentUser(999)).toThrow("USER_NOT_FOUND");
    });
  });
});
