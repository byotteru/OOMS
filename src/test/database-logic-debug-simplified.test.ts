/**
 * データベース層のロジック検証テスト
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { DatabaseManager, User } from "../main/database";

describe("データベース層ロジック検証", () => {
  let db: DatabaseManager;
  const testDbPath = ":memory:"; // インメモリDBを使用

  beforeAll(async () => {
    // テスト用データベースを初期化
    db = await DatabaseManager.getInstance(testDbPath);
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  describe("基本データの確認", () => {
    it("初期データが正しく挿入されている", async () => {
      const users: User[] = await db.getUsers();
      const items = await db.getItems();

      console.log("=== 初期データ確認 ===");
      console.log(
        "Users:",
        users.map((u: User) => ({ id: u.id, name: u.name }))
      );
      console.log(
        "Items:",
        items.map((i: any) => ({ id: i.id, name: i.name, price: i.price }))
      );

      expect(users.length).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("データ整合性の検証", () => {
    it("月次集計の基本動作", async () => {
      // 月次集計を実行
      const monthlyReport = await db.getMonthlyReport("2025-01");

      console.log("=== 月次集計結果 ===");
      console.log("Monthly Report:", monthlyReport);

      // 整合性チェック
      expect(monthlyReport).toBeDefined();
      expect(Array.isArray(monthlyReport.staff_totals)).toBe(true);
    });
  });
});
