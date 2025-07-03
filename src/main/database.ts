/*C:\Users\byott\Documents\OOMS\src\main\database.ts*/

import sqlite3 from "sqlite3";
import { Database } from "sqlite3";
import { promisify } from "util";
import bcrypt from "bcrypt";

// 設計書Ver.5.0準拠の型定義
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string; // レスポンス時は除外
  role_id: number;
  is_active: number;
  display_order?: number;
}

export interface Role {
  id: number;
  name: string; // 'Admin', 'User'
}

export interface Item {
  id: number;
  name: string;
  price: number;
  is_active: number;
  display_order?: number;
  options?: ItemOption[];
}

export interface ItemOption {
  id: number;
  item_id: number;
  name: string;
  price_adjustment: number;
}

export interface Order {
  id: number;
  order_date: string;
  user_id: number;
  status: string; // 'open', 'locked'
  locked_at?: string;
  locked_by_user_id?: number;
  created_at: string;
}

export interface OrderDetail {
  id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  remarks?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  target_entity: string;
  target_id?: number;
  details?: string;
  created_at: string;
}

export interface OrderView {
  id: number;
  order_date: string;
  user_name: string;
  item_name: string;
  quantity: number;
  price: number;
  total_price: number;
  remarks?: string;
  options?: string[];
  status: string;
}

export interface NewOrder {
  order_date: string;
  user_id: number;
  items: {
    item_id: number;
    quantity: number;
    remarks?: string;
    option_ids?: number[];
  }[];
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  startDate: string; // フォーマット用
  endDate: string; // フォーマット用
  items: {
    [itemName: string]: {
      [day: string]: number;
    };
  };
  totals: {
    [day: string]: number;
  };
  totalSummary: {
    item_name: string;
    total_quantity: number;
  }[];
  days: {
    date: string;
    items: {
      item_name: string;
      quantity: number;
    }[];
  }[];
}

export interface MonthlyReport {
  month: string;
  staff_totals: {
    staff_name: string;
    total_amount: number;
  }[];
  grand_total: number;
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
}

export interface Settings {
  garden_name?: string;
  garden_address?: string;
  supplier_name?: string;
  supplier_address?: string;
  supplier_phone?: string;
  [key: string]: string | undefined;
}

// API向け認証情報
export interface LoginCredentials {
  email: string;
  password: string;
}

// 旧Staffインターフェースは後方互換性のため残す
export interface Staff {
  id: number;
  name: string;
  is_active: number;
  display_order?: number;
}

export interface WeeklyOrderData {
  staff_id: number;
  order_date: string; // YYYY-MM-DD format
  item_id: number;
  quantity: number;
}

// 新しいデータ受け取り用の型（洗い替え方式用）
export interface WeeklySavePayload {
  orders: WeeklyOrderData[]; // UI上に存在する注文のリスト
  staffIdsOnScreen: number[]; // UIに表示されていた全スタッフのIDリスト
  weekStart: string; // 週の開始日 (例: '2025-07-01')
  weekEnd: string; // 週の終了日 (例: '2025-07-07')
}

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private static initPromise: Promise<DatabaseManager> | null = null;
  private db!: Database; // 初期化をconnect()で行うため、definite assignment assertionを使用

  private constructor(private dbPath: string) {
    // コンストラクタをプライベートにして直接インスタンス化を防ぐ
  }

  static async getInstance(
    dbPath: string = "ooms.db"
  ): Promise<DatabaseManager> {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }

    if (DatabaseManager.initPromise) {
      return DatabaseManager.initPromise;
    }

    DatabaseManager.initPromise = DatabaseManager.createInstance(dbPath);
    return DatabaseManager.initPromise;
  }

  static hasInstance(): boolean {
    return DatabaseManager.instance !== null;
  }

  private static async createInstance(
    dbPath: string
  ): Promise<DatabaseManager> {
    console.log("DatabaseManager: Creating new instance...");
    const instance = new DatabaseManager(dbPath);
    console.log("DatabaseManager: Connecting to database...");
    await instance.connect();
    console.log("DatabaseManager: Initializing database...");
    await instance.initializeDatabase();
    console.log(
      "DatabaseManager: Database initialization completed successfully!"
    );
    DatabaseManager.instance = instance;
    return instance;
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("データベース接続エラー:", err);
          reject(err);
        } else {
          console.log("データベースに接続しました");
          resolve();
        }
      });
    });
  }

  private async initializeDatabase(): Promise<void> {
    console.log("DatabaseManager: Starting table creation...");
    const createTables = [
      // 設計書Ver.5.0準拠のテーブル定義
      `CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role_id INTEGER NOT NULL DEFAULT 2,
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS item_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price_adjustment INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES items(id)
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_date TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        locked_at TEXT,
        locked_by_user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (DATETIME('now','localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS order_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        remarks TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      )`,
      `CREATE TABLE IF NOT EXISTS order_detail_options (
        order_detail_id INTEGER NOT NULL,
        option_id INTEGER NOT NULL,
        PRIMARY KEY (order_detail_id, option_id),
        FOREIGN KEY (order_detail_id) REFERENCES order_details(id),
        FOREIGN KEY (option_id) REFERENCES item_options(id)
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        target_entity TEXT,
        target_id INTEGER,
        details TEXT,
        created_at TEXT NOT NULL DEFAULT (DATETIME('now','localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`,
      // 後方互換性のためstaffテーブルも保持（データ移行後に削除可能）
      `CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER
      )`,
    ];

    for (const sql of createTables) {
      await this.run(sql);
    }
    console.log("DatabaseManager: Tables created successfully");

    // インデックス作成
    await this.createIndexes();
    console.log("DatabaseManager: Indexes created successfully");

    // 初期データの挿入
    await this.insertInitialData();
    console.log("DatabaseManager: Initial data inserted successfully");
  }

  private async createIndexes(): Promise<void> {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_order_details_item_id ON order_details(item_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`,
    ];

    for (const sql of indexes) {
      await this.run(sql);
    }
  }

  private async insertInitialData(): Promise<void> {
    // ロールの初期データ
    const roleCount = await this.get("SELECT COUNT(*) as count FROM roles");
    if (roleCount.count === 0) {
      await this.run("INSERT INTO roles (id, name) VALUES (1, 'Admin')");
      await this.run("INSERT INTO roles (id, name) VALUES (2, 'User')");
    }

    // デフォルト管理者アカウントの作成
    const userCount = await this.get("SELECT COUNT(*) as count FROM users");
    if (userCount.count === 0) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await this.run(
        "INSERT INTO users (name, email, password_hash, role_id, display_order) VALUES (?, ?, ?, 1, 1)",
        ["管理者", "admin@example.com", passwordHash]
      );
    }

    // スタッフデータの移行（staffテーブル → usersテーブル）
    await this.migrateStaffToUsers();

    // スタッフの初期データ（後方互換性 - 新規インストール時のみ）
    const staffCount = await this.get("SELECT COUNT(*) as count FROM staff");
    if (staffCount.count === 0) {
      const staffData = [
        { name: "スタッフA", display_order: 1 },
        { name: "スタッフB", display_order: 2 },
        { name: "スタッフC", display_order: 3 },
      ];

      for (const staff of staffData) {
        await this.run(
          "INSERT INTO staff (name, display_order) VALUES (?, ?)",
          [staff.name, staff.display_order]
        );
      }
    }

    // 弁当の初期データ
    const itemCount = await this.get("SELECT COUNT(*) as count FROM items");
    if (itemCount.count === 0) {
      const itemData = [
        { name: "テスト弁当1", price: 500, display_order: 1 },
        { name: "テスト弁当2", price: 600, display_order: 2 },
      ];

      for (const item of itemData) {
        await this.run(
          "INSERT INTO items (name, price, display_order) VALUES (?, ?, ?)",
          [item.name, item.price, item.display_order]
        );
      }
    }
  }

  // スタッフデータの移行処理
  private async migrateStaffToUsers(): Promise<void> {
    // 既存のstaffデータをusersテーブルに移行する
    console.log("DatabaseManager: スタッフデータの移行を開始...");

    try {
      // staffテーブルのデータを取得
      const staffMembers = await this.all(
        "SELECT * FROM staff WHERE is_active = 1"
      );

      for (const staff of staffMembers) {
        // 同名のユーザーが既に存在するかチェック
        const existingUser = await this.get(
          "SELECT id FROM users WHERE name = ?",
          [staff.name]
        );

        if (!existingUser) {
          // 存在しない場合は新規作成
          const defaultEmail = `${staff.name.replace(/\s+/g, "")}@ooms.local`;
          const defaultPassword = await bcrypt.hash("staff123", 10);

          await this.run(
            `INSERT INTO users (name, email, password_hash, role_id, is_active, display_order) 
             VALUES (?, ?, ?, 2, ?, ?)`,
            [
              staff.name,
              defaultEmail,
              defaultPassword,
              staff.is_active,
              staff.display_order,
            ]
          );

          console.log(`移行完了: ${staff.name} → users テーブル`);
        } else {
          console.log(`スキップ: ${staff.name} は既にusersテーブルに存在`);
        }
      }

      console.log("DatabaseManager: スタッフデータの移行が完了しました");
    } catch (error) {
      console.error("スタッフデータの移行でエラーが発生しました:", error);
      throw error;
    }
  }

  private run(
    sql: string,
    params: any[] = []
  ): Promise<{ lastID?: number; changes?: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  private get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  private all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // テスト用デバッグメソッド（本番環境では使用しない）
  async debugQuery(sql: string, params: any[] = []): Promise<any[]> {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("debugQuery is only available in test environment");
    }
    return this.all(sql, params);
  }

  // スタッフ関連
  async getStaff(): Promise<Staff[]> {
    return await this.all(
      "SELECT * FROM staff WHERE is_active = 1 ORDER BY display_order, name"
    );
  }

  async addStaff(name: string, displayOrder?: number): Promise<void> {
    await this.run("INSERT INTO staff (name, display_order) VALUES (?, ?)", [
      name,
      displayOrder,
    ]);
  }

  async updateStaff(
    id: number,
    name: string,
    isActive: number,
    displayOrder?: number
  ): Promise<void> {
    await this.run(
      "UPDATE staff SET name = ?, is_active = ?, display_order = ? WHERE id = ?",
      [name, isActive, displayOrder, id]
    );
  }

  async deleteStaff(id: number): Promise<void> {
    await this.run("UPDATE staff SET is_active = 0 WHERE id = ?", [id]);
  }

  // 弁当関連
  async getItems(): Promise<Item[]> {
    const items = await this.all(
      "SELECT * FROM items WHERE is_active = 1 ORDER BY display_order, name"
    );

    // 各アイテムのオプションを取得
    for (const item of items) {
      item.options = await this.all(
        "SELECT * FROM item_options WHERE item_id = ?",
        [item.id]
      );
    }

    return items;
  }

  async addItem(
    name: string,
    price: number,
    displayOrder?: number
  ): Promise<void> {
    await this.run(
      "INSERT INTO items (name, price, display_order) VALUES (?, ?, ?)",
      [name, price, displayOrder]
    );
  }

  async updateItem(
    id: number,
    name: string,
    price: number,
    isActive: number,
    displayOrder?: number
  ): Promise<void> {
    await this.run(
      "UPDATE items SET name = ?, price = ?, is_active = ?, display_order = ? WHERE id = ?",
      [name, price, isActive, displayOrder, id]
    );
  }

  async deleteItem(id: number): Promise<void> {
    await this.run("UPDATE items SET is_active = 0 WHERE id = ?", [id]);
  }

  // 注文関連
  async getOrdersByDate(date: string): Promise<OrderView[]> {
    const sql = `
      SELECT 
        o.id,
        o.order_date,
        u.name as user_name,
        i.name as item_name,
        od.quantity,
        i.price,
        (od.quantity * i.price) as total_price,
        od.remarks,
        o.status,
        GROUP_CONCAT(io.name) as options
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_details od ON o.id = od.order_id
      JOIN items i ON od.item_id = i.id
      LEFT JOIN order_detail_options odo ON od.id = odo.order_detail_id
      LEFT JOIN item_options io ON odo.option_id = io.id
      WHERE o.order_date = ?
      GROUP BY o.id, od.id
      ORDER BY u.display_order, u.name, i.display_order, i.name
    `;

    const rows = await this.all(sql, [date]);
    return rows.map((row) => ({
      ...row,
      options: row.options ? row.options.split(",") : [],
    }));
  }

  async addOrder(orderData: NewOrder): Promise<void> {
    const db = this.db;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 注文を挿入（user_id対応）
        db.run(
          "INSERT INTO orders (order_date, user_id) VALUES (?, ?)",
          [orderData.order_date, orderData.user_id],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }

            const orderId = this.lastID;
            let completed = 0;

            // 監査ログに記録
            db.run(
              "INSERT INTO audit_logs (user_id, action, target_entity, target_id, details) VALUES (?, ?, ?, ?, ?)",
              [
                orderData.user_id,
                "ORDER_CREATE",
                "orders",
                orderId,
                JSON.stringify({
                  order_date: orderData.order_date,
                  items_count: orderData.items.length,
                }),
              ]
            );

            // 注文詳細を挿入
            for (const item of orderData.items) {
              db.run(
                "INSERT INTO order_details (order_id, item_id, quantity, remarks) VALUES (?, ?, ?, ?)",
                [orderId, item.item_id, item.quantity, item.remarks],
                function (err) {
                  if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                    return;
                  }

                  const orderDetailId = this.lastID;

                  // オプションがある場合は挿入
                  if (item.option_ids && item.option_ids.length > 0) {
                    let optionCompleted = 0;
                    for (const optionId of item.option_ids) {
                      db.run(
                        "INSERT INTO order_detail_options (order_detail_id, option_id) VALUES (?, ?)",
                        [orderDetailId, optionId],
                        (err) => {
                          if (err) {
                            db.run("ROLLBACK");
                            reject(err);
                            return;
                          }
                          optionCompleted++;
                          if (optionCompleted === item.option_ids!.length) {
                            completed++;
                            if (completed === orderData.items.length) {
                              db.run("COMMIT");
                              resolve();
                            }
                          }
                        }
                      );
                    }
                  } else {
                    completed++;
                    if (completed === orderData.items.length) {
                      db.run("COMMIT");
                      resolve();
                    }
                  }
                }
              );
            }
          }
        );
      });
    });
  }

  async deleteOrder(orderId: number): Promise<void> {
    const db = this.db;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 関連するオプションデータを削除
        db.run(
          "DELETE FROM order_detail_options WHERE order_detail_id IN (SELECT id FROM order_details WHERE order_id = ?)",
          [orderId],
          (err) => {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
              return;
            }

            // 注文詳細を削除
            db.run(
              "DELETE FROM order_details WHERE order_id = ?",
              [orderId],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  reject(err);
                  return;
                }

                // 注文を削除
                db.run("DELETE FROM orders WHERE id = ?", [orderId], (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                  } else {
                    db.run("COMMIT");
                    resolve();
                  }
                });
              }
            );
          }
        );
      });
    });
  }

  // 週次レポート
  async getWeeklyReport(startDate: string): Promise<WeeklyReport> {
    // 週の終了日を計算
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const endDate = end.toISOString().split("T")[0];

    const sql = `
      SELECT 
        o.order_date,
        i.name as item_name,
        SUM(od.quantity) as total_quantity
      FROM orders o
      JOIN order_details od ON o.id = od.order_id
      JOIN items i ON od.item_id = i.id
      WHERE o.order_date BETWEEN ? AND ?
      GROUP BY o.order_date, i.name
      ORDER BY i.display_order, i.name, o.order_date
    `;

    const rows = await this.all(sql, [startDate, endDate]);

    const report: WeeklyReport = {
      week_start: startDate,
      week_end: endDate,
      startDate: startDate,
      endDate: endDate,
      items: {},
      totals: {},
      totalSummary: [],
      days: [],
    };

    // 曜日の配列
    const days = ["月", "火", "水", "木", "金", "土", "日"];

    // 日別データを初期化
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      report.days.push({
        date: date.toISOString().split("T")[0],
        items: [],
      });
    }

    // アイテム別総数を計算するためのマップ
    const itemTotals: { [itemName: string]: number } = {};

    // データを整理
    for (const row of rows) {
      const date = new Date(row.order_date);
      const dayIndex = (date.getDay() + 6) % 7; // 月曜日を0にする
      const dayName = days[dayIndex];

      if (!report.items[row.item_name]) {
        report.items[row.item_name] = {};
      }

      report.items[row.item_name][dayName] = row.total_quantity;

      if (!report.totals[dayName]) {
        report.totals[dayName] = 0;
      }
      report.totals[dayName] += row.total_quantity;

      // 日別データに追加（境界チェックを追加）
      if (
        dayIndex >= 0 &&
        dayIndex < report.days.length &&
        report.days[dayIndex]
      ) {
        const existingItem = report.days[dayIndex].items.find(
          (item) => item.item_name === row.item_name
        );
        if (existingItem) {
          existingItem.quantity += row.total_quantity;
        } else {
          report.days[dayIndex].items.push({
            item_name: row.item_name,
            quantity: row.total_quantity,
          });
        }
      }

      // アイテム別総数を計算
      if (!itemTotals[row.item_name]) {
        itemTotals[row.item_name] = 0;
      }
      itemTotals[row.item_name] += row.total_quantity;
    }

    // totalSummaryを生成
    report.totalSummary = Object.entries(itemTotals).map(
      ([item_name, total_quantity]) => ({
        item_name,
        total_quantity,
      })
    );

    return report;
  }

  // 月次レポート（設計書Ver.5.0準拠）
  async getMonthlyReport(month: string): Promise<MonthlyReport> {
    const sql = `
      SELECT 
        u.name as staff_name,
        SUM(od.quantity * i.price) as total_amount
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_details od ON o.id = od.order_id
      JOIN items i ON od.item_id = i.id
      WHERE strftime('%Y-%m', o.order_date) = ?
      GROUP BY u.id, u.name
      ORDER BY u.display_order, u.name
    `;

    const rows = await this.all(sql, [month]);

    // 月次締め状況を確認
    const lockStatus = await this.get(
      `SELECT status, locked_at, locked_by_user_id, u.name as locked_by_name 
       FROM orders o
       LEFT JOIN users u ON o.locked_by_user_id = u.id
       WHERE strftime('%Y-%m', o.order_date) = ? AND status = 'locked'
       LIMIT 1`,
      [month]
    );

    const report: MonthlyReport = {
      month: month,
      staff_totals: rows,
      grand_total: rows.reduce((sum, row) => sum + row.total_amount, 0),
      is_locked: !!lockStatus,
      locked_at: lockStatus?.locked_at,
      locked_by: lockStatus?.locked_by_name,
    };

    return report;
  }

  // 月次締め処理（設計書Ver.5.0準拠）
  async lockMonth(year: number, month: number, userId: number): Promise<void> {
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
    const lockTimestamp = new Date().toISOString();

    await this.run("BEGIN TRANSACTION");

    try {
      // 対象月の全注文をロック
      await this.run(
        `UPDATE orders 
         SET status = 'locked', locked_at = ?, locked_by_user_id = ? 
         WHERE strftime('%Y-%m', order_date) = ? AND status = 'open'`,
        [lockTimestamp, userId, monthStr]
      );

      // 監査ログに記録
      await this.addAuditLog(userId, "MONTH_LOCK", "orders", null, {
        month: monthStr,
        locked_at: lockTimestamp,
      });

      await this.run("COMMIT");
    } catch (error) {
      await this.run("ROLLBACK");
      throw error;
    }
  }

  // ユーザー固有の注文取得（セルフサービス対応）
  async getOrdersByUser(
    userId: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<OrderView[]> {
    let whereClause = "WHERE o.user_id = ?";
    const params: any[] = [userId];

    if (dateFrom) {
      whereClause += " AND o.order_date >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += " AND o.order_date <= ?";
      params.push(dateTo);
    }

    const sql = `
      SELECT 
        o.id,
        o.order_date,
        u.name as user_name,
        i.name as item_name,
        od.quantity,
        i.price,
        (od.quantity * i.price) as total_price,
        od.remarks,
        o.status,
        GROUP_CONCAT(io.name) as options
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_details od ON o.id = od.order_id
      JOIN items i ON od.item_id = i.id
      LEFT JOIN order_detail_options odo ON od.id = odo.order_detail_id
      LEFT JOIN item_options io ON odo.option_id = io.id
      ${whereClause}
      GROUP BY o.id, od.id
      ORDER BY o.order_date DESC, i.display_order, i.name
    `;

    const rows = await this.all(sql, params);
    return rows.map((row) => ({
      ...row,
      options: row.options ? row.options.split(",") : [],
    }));
  }

  // 注文キャンセル（ロック済みは不可）
  async cancelOrder(orderId: number, userId: number): Promise<void> {
    // 注文の存在確認とロック状態チェック
    const order = await this.get(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [orderId, userId]
    );

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.status === "locked") {
      throw new Error("ORDER_LOCKED");
    }

    await this.run("BEGIN TRANSACTION");

    try {
      // 注文詳細オプションを削除
      await this.run(
        `DELETE FROM order_detail_options 
         WHERE order_detail_id IN (
           SELECT id FROM order_details WHERE order_id = ?
         )`,
        [orderId]
      );

      // 注文詳細を削除
      await this.run("DELETE FROM order_details WHERE order_id = ?", [orderId]);

      // 注文を削除
      await this.run("DELETE FROM orders WHERE id = ?", [orderId]);

      // 監査ログに記録
      await this.addAuditLog(userId, "ORDER_CANCEL", "orders", orderId, {
        order_date: order.order_date,
      });

      await this.run("COMMIT");
    } catch (error) {
      await this.run("ROLLBACK");
      throw error;
    }
  }

  // 週間注文保存（洗い替え方式）
  async saveWeeklyOrders(payload: WeeklySavePayload): Promise<void> {
    const { orders, staffIdsOnScreen, weekStart, weekEnd } = payload;

    // 画面にスタッフが一人も表示されていない場合は何もしない
    if (staffIdsOnScreen.length === 0) {
      console.log("保存対象のスタッフがいません。");
      return;
    }

    // トランザクション開始
    await this.run("BEGIN TRANSACTION");
    try {
      // ステップ1：これから操作する範囲の、既存の注文IDをすべて取得
      const targetOrderIdsResult = await this.all(
        // IN句を安全に組み立てる
        `SELECT id FROM orders WHERE user_id IN (${staffIdsOnScreen
          .map(() => "?")
          .join(",")}) AND order_date BETWEEN ? AND ?`,
        [...staffIdsOnScreen, weekStart, weekEnd]
      );

      if (targetOrderIdsResult.length > 0) {
        const idsToDelete = targetOrderIdsResult.map((row) => row.id);

        // ステップ2：既存の注文を、関連テーブルから順番に「すべて削除」する
        // まずは子テーブル (order_details) から削除
        await this.run(
          `DELETE FROM order_details WHERE order_id IN (${idsToDelete
            .map(() => "?")
            .join(",")})`,
          idsToDelete
        );
        // 次に親テーブル (orders) を削除
        await this.run(
          `DELETE FROM orders WHERE id IN (${idsToDelete
            .map(() => "?")
            .join(",")})`,
          idsToDelete
        );
      }

      // ステップ3：UIの最新の状態に基づいた新しい注文データを「すべて挿入」する
      // staff_id と order_date で注文をグループ化
      const ordersToCreate: {
        [key: string]: {
          staff_id: number;
          order_date: string;
          details: { item_id: number; quantity: number }[];
        };
      } = {};
      for (const order of orders) {
        // キーの区切り文字を変更してハイフン問題を回避
        const key = `${order.staff_id}|${order.order_date}`;
        if (!ordersToCreate[key]) {
          ordersToCreate[key] = {
            staff_id: order.staff_id,
            order_date: order.order_date,
            details: [],
          };
        }
        ordersToCreate[key].details.push({
          item_id: order.item_id,
          quantity: order.quantity,
        });
      }

      // グループ化した注文をDBに挿入
      for (const key in ordersToCreate) {
        const order = ordersToCreate[key];

        const result = await this.run(
          "INSERT INTO orders (order_date, user_id) VALUES (?, ?)",
          [order.order_date, order.staff_id]
        );
        const newOrderId = result.lastID!;

        for (const detail of order.details) {
          await this.run(
            "INSERT INTO order_details (order_id, item_id, quantity) VALUES (?, ?, ?)",
            [newOrderId, detail.item_id, detail.quantity]
          );
        }
      }

      // ステップ4：すべての処理が成功したら、変更を確定
      await this.run("COMMIT");
      console.log("週間注文を正常に保存しました。");
    } catch (error) {
      // ステップ5：途中でエラーが起きたら、すべての変更を無かったことにする
      await this.run("ROLLBACK");
      console.error(
        "週間注文の保存に失敗しました。ロールバックを実行します:",
        error
      );
      throw error;
    }
  }

  // 設定関連
  async getSettings(): Promise<Settings> {
    const rows = await this.all("SELECT key, value FROM settings");
    const settings: Settings = {};

    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return settings;
  }

  async saveSettings(settings: Settings): Promise<void> {
    const db = this.db;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const keys = Object.keys(settings);
        let completed = 0;

        for (const key of keys) {
          const value = settings[key];
          db.run(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            [key, value],
            (err) => {
              if (err) {
                db.run("ROLLBACK");
                reject(err);
                return;
              }
              completed++;
              if (completed === keys.length) {
                db.run("COMMIT");
                resolve();
              }
            }
          );
        }

        if (keys.length === 0) {
          db.run("COMMIT");
          resolve();
        }
      });
    });
  }

  // 認証・ユーザー関連（設計書Ver.5.0準拠）
  async login(email: string, password: string): Promise<User> {
    const user = await this.get(
      "SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ? AND u.is_active = 1",
      [email]
    );

    if (!user) {
      throw new Error("AUTH_FAILED");
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error("AUTH_FAILED");
    }

    // レスポンスからパスワードハッシュを除去
    const { password_hash, ...userWithoutPassword } = user;

    // 監査ログに記録
    await this.addAuditLog(user.id, "USER_LOGIN", "users", user.id, {
      email: email,
      timestamp: new Date().toISOString(),
    });

    return userWithoutPassword;
  }

  async getCurrentUser(userId: number): Promise<User> {
    const user = await this.get(
      "SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = 1",
      [userId]
    );

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUsers(): Promise<User[]> {
    const users = await this.all(
      "SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.is_active = 1 ORDER BY u.display_order, u.name"
    );

    // パスワードハッシュを除去
    return users.map(({ password_hash, ...user }) => user);
  }

  async addUser(
    name: string,
    email: string,
    password: string,
    roleId: number = 2,
    displayOrder?: number
  ): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);

    await this.run(
      "INSERT INTO users (name, email, password_hash, role_id, display_order) VALUES (?, ?, ?, ?, ?)",
      [name, email, passwordHash, roleId, displayOrder]
    );

    // 監査ログに記録
    await this.addAuditLog(null, "USER_CREATE", "users", null, {
      name: name,
      email: email,
      role_id: roleId,
    });
  }

  async updateUser(
    id: number,
    name: string,
    email: string,
    roleId: number,
    isActive: number,
    displayOrder?: number
  ): Promise<void> {
    const oldUser = await this.get("SELECT * FROM users WHERE id = ?", [id]);

    await this.run(
      "UPDATE users SET name = ?, email = ?, role_id = ?, is_active = ?, display_order = ? WHERE id = ?",
      [name, email, roleId, isActive, displayOrder, id]
    );

    // 監査ログに記録
    await this.addAuditLog(null, "USER_UPDATE", "users", id, {
      old: oldUser,
      new: {
        name,
        email,
        role_id: roleId,
        is_active: isActive,
        display_order: displayOrder,
      },
    });
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.get("SELECT * FROM users WHERE id = ?", [id]);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    // 物理削除ではなく論理削除（is_activeを0に設定）
    await this.run("UPDATE users SET is_active = 0 WHERE id = ?", [id]);

    // 監査ログに記録
    await this.addAuditLog(null, "USER_DEACTIVATE", "users", id, {
      deactivated_user: user,
    });
  }

  // 監査ログ関連
  async addAuditLog(
    userId: number | null,
    action: string,
    targetEntity: string,
    targetId: number | null,
    details: any
  ): Promise<void> {
    await this.run(
      "INSERT INTO audit_logs (user_id, action, target_entity, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, action, targetEntity, targetId, JSON.stringify(details)]
    );
  }

  async getAuditLogs(
    filters: {
      userId?: number;
      action?: string;
      targetEntity?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (filters.userId) {
      whereClause += " AND user_id = ?";
      params.push(filters.userId);
    }

    if (filters.action) {
      whereClause += " AND action = ?";
      params.push(filters.action);
    }

    if (filters.targetEntity) {
      whereClause += " AND target_entity = ?";
      params.push(filters.targetEntity);
    }

    if (filters.dateFrom) {
      whereClause += " AND created_at >= ?";
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereClause += " AND created_at <= ?";
      params.push(filters.dateTo);
    }

    // 合計件数を取得
    const totalResult = await this.get(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      params
    );

    // ページネーション付きでログを取得
    let limitClause = "";
    if (filters.limit) {
      limitClause += ` LIMIT ${filters.limit}`;
      if (filters.offset) {
        limitClause += ` OFFSET ${filters.offset}`;
      }
    }

    const logs = await this.all(
      `SELECT al.*, u.name as user_name 
       FROM audit_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       ${whereClause} 
       ORDER BY al.created_at DESC ${limitClause}`,
      params
    );

    return {
      logs: logs,
      total: totalResult.count,
    };
  }

  // データベースを閉じる
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 既にDBハンドルがない（＝閉じているか、閉じる処理中）場合は、何もせず正常終了
      if (!this.db) {
        console.log("データベースは既に閉じられています");
        return resolve();
      }

      // ★重要：先にインスタンス変数を null 化することで、後続の close 呼び出しを即座に終了させる
      const dbToClose = this.db;
      this.db = null!; // null! は「ここにはnullが入らない」というTypeScriptへの意思表示
      DatabaseManager.instance = null;
      DatabaseManager.initPromise = null;

      console.log("データベースの切断処理を開始します...");
      dbToClose.close((err) => {
        if (err) {
          console.error("データベース切断エラー:", err);
          // エラーが発生しても、アプリケーションは終了処理を続けるべきなので reject せずに resolve する
          resolve(); // エラーはログに出すが、処理は止めない
        } else {
          console.log("データベースを正常に切断しました");
          resolve();
        }
      });
    });
  }

  // データベースを完全にリセットする（開発用）
  private async dropAllTables(): Promise<void> {
    const dropTables = [
      "DROP TABLE IF EXISTS audit_logs",
      "DROP TABLE IF EXISTS order_detail_options",
      "DROP TABLE IF EXISTS order_details",
      "DROP TABLE IF EXISTS orders",
      "DROP TABLE IF EXISTS item_options",
      "DROP TABLE IF EXISTS items",
      "DROP TABLE IF EXISTS staff",
      "DROP TABLE IF EXISTS users",
      "DROP TABLE IF EXISTS roles",
      "DROP TABLE IF EXISTS settings",
    ];

    for (const sql of dropTables) {
      await this.run(sql);
    }
  }

  // 強制的にデータベースを再初期化
  public async forceReinitialize(): Promise<void> {
    try {
      await this.dropAllTables();
      await this.initializeDatabase();
      console.log("データベースを再初期化しました");
    } catch (error) {
      console.error("データベース再初期化エラー:", error);
    }
  }

  // テスト用: シングルトンインスタンスをリセット
  public static resetInstance(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.db?.close(() => {});
    }
    DatabaseManager.instance = null;
    DatabaseManager.initPromise = null;
  }

  // 週間の注文データを取得（WeeklyOrderPage用）
  async getOrdersForWeek(startDate: string): Promise<WeeklyOrderData[]> {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const endDate = end.toISOString().split("T")[0];

    const sql = `
      SELECT
        o.user_id as staff_id,
        o.order_date,
        od.item_id,
        od.quantity
      FROM orders o
      JOIN order_details od ON o.id = od.order_id
      WHERE o.order_date BETWEEN ? AND ?
    `;

    return this.all(sql, [startDate, endDate]);
  }
}
