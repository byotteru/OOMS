/**
 * データベース層のロジック検証テスト
 */
import { beforeAll, describe, expect, it } from "vitest";
import { DatabaseManager } from "../main/database";
import fs from "fs";

describe("データベース層ロジック検証", () => {
  let db: DatabaseManager;
  const testDbPath = ":memory:"; // インメモリDBを使用

  beforeAll(() => {
    // テスト用データベースを初期化
    db = DatabaseManager.getInstance(testDbPath);
  });

  describe("基本データの確認", () => {
    it("初期データが正しく挿入されている", () => {
      const users = db.getUsers();
      const staff = db.getStaff();
      const items = db.getItems();

      console.log("=== 初期データ確認 ===");
      console.log("Users:", users);
      console.log("Staff:", staff);
      console.log("Items:", items);

      expect(users.length).toBeGreaterThan(0);
      expect(staff.length).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("週間注文の保存と取得", () => {
    it("週間注文データの保存・取得・月次集計の一連の流れ", async () => {
      const users = await db.getUsers();
      const staff = await db.getStaff();
      const items = await db.getItems();

      console.log("=== テストデータ確認 ===");
      console.log(
        "Available users:",
        users.map((u) => ({ id: u.id, name: u.name }))
      );
      console.log(
        "Available staff:",
        staff.map((s) => ({ id: s.id, name: s.name }))
      );
      console.log(
        "Available items:",
        items.map((i) => ({ id: i.id, name: i.name, price: i.price }))
      );

      // テスト用の週間注文データを作成
      const weeklyOrders = [
        {
          staff_id: users[0].id,
          order_date: "2025-01-06",
          item_id: items[0].id,
          quantity: 2,
        },
        {
          staff_id: users[0].id,
          order_date: "2025-01-07",
          item_id: items[1].id,
          quantity: 1,
        },
        {
          staff_id: users[0].id,
          order_date: "2025-01-08",
          item_id: items[0].id,
          quantity: 1,
        },
      ];

      const payload = {
        orders: weeklyOrders,
        staffIdsOnScreen: [users[0].id],
        weekStart: "2025-01-06",
        weekEnd: "2025-01-12",
      };

      console.log("=== 週間注文保存 ===");
      console.log("保存データ:", payload);

      // 週間注文を保存
      await db.saveWeeklyOrders(payload);

      // 保存されたデータを取得
      const savedOrders = await db.getOrdersForWeek("2025-01-06");
      console.log("保存後の取得データ:", savedOrders);

      // 月次集計を実行
      const monthlyReport = await db.getMonthlyReport("2025-01");
      console.log("=== 月次集計結果 ===");
      console.log("Monthly Report:", monthlyReport);

      // 検証
      expect(savedOrders.length).toBeGreaterThan(0);
      expect(monthlyReport.staff_totals.length).toBeGreaterThan(0);

      // 計算の検証
      const expectedTotal = weeklyOrders.reduce((total, order) => {
        const item = items.find((i) => i.id === order.item_id);
        return total + (item ? item.price * order.quantity : 0);
      }, 0);

      console.log("期待される合計金額:", expectedTotal);
      console.log("実際の合計金額:", monthlyReport.grand_total);

      expect(monthlyReport.grand_total).toBe(expectedTotal);
    });
  });

  describe("データ整合性の検証", () => {
    it("users と staff テーブルの関係性", async () => {
      const users = await db.getUsers();
      const staff = await db.getStaff();

      console.log("=== users と staff の関係性 ===");
      console.log("users table count:", users.length);
      console.log("staff table count:", staff.length);

      // usersとstaffの重複チェック
      const userNames = users.map((u) => u.name);
      const staffNames = staff.map((s) => s.name);

      console.log("user names:", userNames);
      console.log("staff names:", staffNames);

      // 注文保存時にはusersテーブルのIDを使用するが、
      // UI上のスタッフ選択ではstaffテーブルを使用している可能性がある
      // この不整合が月次集計に影響している可能性
    });

    it("注文データと月次集計の整合性", async () => {
      // 月次集計APIを使用してデータを確認
      const monthlyReport = await db.getMonthlyReport("2025-01");

      console.log("=== 月次集計API結果 ===");
      console.log("Monthly Report:", monthlyReport);

      // 週間データ取得APIを使用
      const weeklyData = await db.getOrdersForWeek("2025-01-06");

      console.log("=== 週間データ取得結果 ===");
      console.log("Weekly Data:", weeklyData);

      // 全ユーザーのデータを確認
      const allUsers = await db.getUsers();
      console.log("=== 全ユーザー ===");
      console.log("All Users:", allUsers);

      // 整合性チェック
      expect(monthlyReport).toBeDefined();
      expect(Array.isArray(monthlyReport.staff_totals)).toBe(true);
    });
  });
});
