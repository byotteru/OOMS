import { describe, it, expect } from "vitest";
import type {
  OrderView,
  NewOrder,
  WeeklyReport,
  MonthlyReport,
  User,
  AuditLog,
  LoginCredentials,
} from "./types";

describe("Type Definitions", () => {
  describe("OrderView", () => {
    it("should match expected structure", () => {
      const orderView: OrderView = {
        id: 1,
        order_date: "2025-07-01",
        user_name: "テストユーザー",
        item_name: "テスト弁当",
        quantity: 1,
        price: 500,
        total_price: 500,
        status: "open",
        remarks: "テスト備考",
        options: ["オプション1"],
      };

      expect(orderView.id).toBe(1);
      expect(orderView.order_date).toBe("2025-07-01");
      expect(orderView.user_name).toBe("テストユーザー");
      expect(orderView.status).toBe("open");
    });
  });

  describe("NewOrder", () => {
    it("should match expected structure", () => {
      const newOrder: NewOrder = {
        order_date: "2025-07-01",
        user_id: 1,
        items: [
          {
            item_id: 1,
            quantity: 1,
            remarks: "テスト備考",
            option_ids: [1, 2],
          },
        ],
      };

      expect(newOrder.order_date).toBe("2025-07-01");
      expect(newOrder.user_id).toBe(1);
      expect(newOrder.items).toHaveLength(1);
      expect(newOrder.items[0].item_id).toBe(1);
    });
  });

  describe("MonthlyReport", () => {
    it("should match expected structure", () => {
      const monthlyReport: MonthlyReport = {
        month: "2025-07",
        staff_totals: [{ staff_name: "テストスタッフ", total_amount: 5000 }],
        grand_total: 5000,
        is_locked: false,
        locked_at: "2025-07-31T00:00:00Z",
        locked_by: "admin",
      };

      expect(monthlyReport.month).toBe("2025-07");
      expect(monthlyReport.staff_totals).toHaveLength(1);
      expect(monthlyReport.grand_total).toBe(5000);
      expect(monthlyReport.is_locked).toBe(false);
    });
  });

  describe("User", () => {
    it("should match expected structure", () => {
      const user: User = {
        id: 1,
        name: "テストユーザー",
        email: "test@example.com",
        role_id: 2,
        is_active: 1,
        display_order: 1,
      };

      expect(user.id).toBe(1);
      expect(user.name).toBe("テストユーザー");
      expect(user.email).toBe("test@example.com");
      expect(user.role_id).toBe(2);
    });
  });

  describe("LoginCredentials", () => {
    it("should match expected structure", () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      expect(credentials.email).toBe("test@example.com");
      expect(credentials.password).toBe("password123");
    });
  });
});
