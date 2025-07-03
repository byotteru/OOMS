// グローバル型定義ファイル（設計書Ver.5.0準拠）
import type {
  Staff,
  Item,
  OrderView,
  NewOrder,
  WeeklyReport,
  MonthlyReport,
  Settings,
  User,
  AuditLog,
  WeeklyOrderData,
  WeeklySavePayload,
} from "./main/database";

declare global {
  interface Window {
    api: {
      // 認証関連
      login(email: string, password: string): Promise<User>;
      getCurrentUser(userId: number): Promise<User>;

      // ユーザー管理
      getUsers(): Promise<User[]>;
      addUser(
        name: string,
        email: string,
        password: string,
        roleId?: number,
        displayOrder?: number
      ): Promise<void>;
      updateUser(
        id: number,
        name: string,
        email: string,
        roleId: number,
        isActive: number,
        displayOrder?: number
      ): Promise<void>;
      deleteUser(id: number): Promise<void>;

      // スタッフ関連（後方互換性）
      getStaff(): Promise<Staff[]>;
      addStaff(name: string, displayOrder?: number): Promise<void>;
      updateStaff(
        id: number,
        name: string,
        isActive: number,
        displayOrder?: number
      ): Promise<void>;
      deleteStaff(id: number): Promise<void>;

      // 弁当関連
      getItems(): Promise<Item[]>;
      addItem(
        name: string,
        price: number,
        displayOrder?: number
      ): Promise<void>;
      updateItem(
        id: number,
        name: string,
        price: number,
        isActive: number,
        displayOrder?: number
      ): Promise<void>;
      deleteItem(id: number): Promise<void>;

      // 注文関連
      getOrdersByDate(date: string): Promise<OrderView[]>;
      getOrdersByUser(
        userId: number,
        dateFrom?: string,
        dateTo?: string
      ): Promise<OrderView[]>;
      addOrder(orderData: NewOrder): Promise<void>;
      cancelOrder(orderId: number, userId: number): Promise<void>;
      deleteOrder(orderId: number): Promise<void>;

      // 週間注文関連
      getOrdersForWeek(startDate: string): Promise<WeeklyOrderData[]>;
      saveWeeklyOrders(
        payload: WeeklySavePayload
      ): Promise<{ success: boolean; error?: string }>;

      // レポート関連
      getWeeklyReport(startDate: string): Promise<WeeklyReport>;
      getMonthlyReport(month: string): Promise<MonthlyReport>;

      // 月次締め処理
      lockMonth(year: number, month: number, userId: number): Promise<void>;

      // 監査ログ
      getAuditLogs(filters?: {
        userId?: number;
        action?: string;
        targetEntity?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        offset?: number;
      }): Promise<{ logs: AuditLog[]; total: number }>;

      // 設定関連
      getSettings(): Promise<Settings>;
      saveSettings(settings: Settings): Promise<void>;

      // ユーティリティ
      showErrorDialog(title: string, message: string): Promise<void>;
      showInfoDialog(title: string, message: string): Promise<void>;
      exportCSV(data: any[], filename: string): Promise<void>;
    };
  }
}

export {};
