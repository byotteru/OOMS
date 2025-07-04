import { contextBridge, ipcRenderer } from "electron";
import {
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
} from "../main/database";

// レンダラープロセスに公開するAPI
const api = {
  // ユーザー管理
  getUsers: (): Promise<User[]> => ipcRenderer.invoke("get-users"),
  addUser: (
    name: string,
    email: string,
    password: string,
    roleId?: number,
    displayOrder?: number
  ): Promise<void> =>
    ipcRenderer.invoke("add-user", name, email, password, roleId, displayOrder),
  updateUser: (
    id: number,
    name: string,
    email: string,
    roleId: number,
    isActive: number,
    displayOrder?: number
  ): Promise<void> =>
    ipcRenderer.invoke(
      "update-user",
      id,
      name,
      email,
      roleId,
      isActive,
      displayOrder
    ),
  deleteUser: (id: number): Promise<void> =>
    ipcRenderer.invoke("delete-user", id),

  // スタッフ関連（後方互換性）
  getStaff: (): Promise<Staff[]> => ipcRenderer.invoke("get-staff"),
  addStaff: (name: string, displayOrder?: number): Promise<void> =>
    ipcRenderer.invoke("add-staff", name, displayOrder),
  updateStaff: (
    id: number,
    name: string,
    isActive: number,
    displayOrder?: number
  ): Promise<void> =>
    ipcRenderer.invoke("update-staff", id, name, isActive, displayOrder),
  deleteStaff: (id: number): Promise<void> =>
    ipcRenderer.invoke("delete-staff", id),

  // 弁当関連
  getItems: (): Promise<Item[]> => ipcRenderer.invoke("get-items"),
  addItem: (
    name: string,
    price: number,
    displayOrder?: number
  ): Promise<void> => ipcRenderer.invoke("add-item", name, price, displayOrder),
  updateItem: (
    id: number,
    name: string,
    price: number,
    isActive: number,
    displayOrder?: number
  ): Promise<void> =>
    ipcRenderer.invoke("update-item", id, name, price, isActive, displayOrder),
  deleteItem: (id: number): Promise<void> =>
    ipcRenderer.invoke("delete-item", id),

  // 注文関連
  getOrdersByDate: (date: string): Promise<OrderView[]> =>
    ipcRenderer.invoke("get-orders-by-date", date),
  getOrdersByUser: (
    userId: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<OrderView[]> =>
    ipcRenderer.invoke("get-orders-by-user", userId, dateFrom, dateTo),
  addOrder: (orderData: NewOrder): Promise<void> =>
    ipcRenderer.invoke("add-order", orderData),
  cancelOrder: (orderId: number, userId: number): Promise<void> =>
    ipcRenderer.invoke("cancel-order", orderId, userId),
  deleteOrder: (orderId: number): Promise<void> =>
    ipcRenderer.invoke("delete-order", orderId),

  // 週間注文関連
  saveWeeklyOrders: (
    payload: WeeklySavePayload
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("save-weekly-orders", payload),

  // レポート関連
  getWeeklyReport: (startDate: string): Promise<WeeklyReport> =>
    ipcRenderer.invoke("get-weekly-report", startDate),
  getOrdersForWeek: (startDate: string): Promise<WeeklyOrderData[]> =>
    ipcRenderer.invoke("get-orders-for-week", startDate),
  getMonthlyReport: (month: string): Promise<MonthlyReport> =>
    ipcRenderer.invoke("get-monthly-report", month),

  // 月次締め処理
  lockMonth: (year: number, month: number, userId: number): Promise<void> =>
    ipcRenderer.invoke("lock-month", year, month, userId),

  // 監査ログ
  getAuditLogs: (filters?: {
    userId?: number;
    action?: string;
    targetEntity?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> =>
    ipcRenderer.invoke("get-audit-logs", filters),

  // 設定関連
  getSettings: (): Promise<Settings> => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke("save-settings", settings),

  // ユーティリティ
  showErrorDialog: (title: string, message: string): Promise<void> =>
    ipcRenderer.invoke("show-error-dialog", title, message),
  showInfoDialog: (title: string, message: string): Promise<void> =>
    ipcRenderer.invoke("show-info-dialog", title, message),
  exportCSV: (data: any[], filename: string): Promise<void> =>
    ipcRenderer.invoke("export-csv", data, filename),
};

// APIをレンダラープロセスに公開
contextBridge.exposeInMainWorld("api", api);
