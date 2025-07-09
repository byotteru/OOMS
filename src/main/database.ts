/*C:\Users\byott\Documents\OOMS\src\main\database.ts*/

import Database from "better-sqlite3";
import * as bcrypt from "bcrypt";
import { app } from "electron";
import path from "path";

// 設計書Ver.5.0準拠の型定義
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string; // レスポンス時は除外
  role_id: number;
  role_name?: string; // JOINで取得される場合に使用
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
  private db!: Database.Database; // better-sqlite3の型定義を使用

  private constructor(private dbPath: string) {
    // コンストラクタをプライベートにして直接インスタンス化を防ぐ
  }

  static getInstance(dbPath: string = "ooms.db"): DatabaseManager {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }

    return DatabaseManager.createInstance(dbPath);
  }

  static hasInstance(): boolean {
    return DatabaseManager.instance !== null;
  }

  private static createInstance(dbPath: string): DatabaseManager {
    console.log("DatabaseManager: Creating new instance...");
    const instance = new DatabaseManager(dbPath);

    try {
      console.log("DatabaseManager: Connecting to database...");
      instance.connect(); // 同期的なconnect
      console.log("DatabaseManager: Initializing database...");
      instance.initializeDatabase(); // 同期的なinitializeDatabase
      console.log(
        "DatabaseManager: Database initialization completed successfully!"
      );
      DatabaseManager.instance = instance;
      return instance;
    } catch (error) {
      console.error("DatabaseManager: Initialization failed:", error);

      // better-sqlite3の問題の場合、詳細なエラーメッセージを提供
      if (
        error instanceof Error &&
        error.message.includes("NODE_MODULE_VERSION")
      ) {
        console.error("✕ better-sqlite3のバージョン不整合が発生しました。");
        console.error(
          "解決方法: npm rebuild better-sqlite3 または npx electron-rebuild を実行してください。"
        );
      }

      throw error;
    }
  }

  private connect(): void {
    try {
      // better-sqlite3は同期的にデータベース接続を行う
      this.db = new Database(this.dbPath);
      // WALモードを有効にしてパフォーマンスを向上
      this.db.pragma("journal_mode = WAL");
      // 外部キー制約を有効化
      this.db.pragma("foreign_keys = ON");
      console.log("データベースに接続しました");
    } catch (err) {
      console.error("データベース接続エラー:", err);

      // better-sqlite3の一般的な問題の詳細なエラーメッセージ
      if (err instanceof Error) {
        if (err.message.includes("NODE_MODULE_VERSION")) {
          console.error(
            "✕ better-sqlite3がElectronのNode.jsバージョンと互換性がありません。"
          );
          console.error("現在のNode.js:", process.version);
          console.error("Electronのバージョン:", process.versions.electron);
          console.error("解決方法1: npm run electron:rebuild");
          console.error("解決方法2: npx electron-rebuild --force");
          console.error(
            "解決方法3: rm -rf node_modules/better-sqlite3 && npm install better-sqlite3 && npx electron-rebuild"
          );
        } else if (err.message.includes("database is locked")) {
          console.error(
            "✕ データベースがロックされています。他のプロセスが使用している可能性があります。"
          );
        } else if (err.message.includes("no such file")) {
          console.error(
            "✕ データベースファイルが見つかりません。新しいデータベースを作成します。"
          );
        }
      }

      throw err;
    }
  }

  private initializeDatabase(): void {
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

    // better-sqlite3では同期的にSQL実行
    for (const sql of createTables) {
      this.db.exec(sql);
    }
    console.log("DatabaseManager: Tables created successfully");

    // インデックス作成
    this.createIndexes();
    console.log("DatabaseManager: Indexes created successfully");

    // 初期データの挿入
    this.insertInitialData();
    console.log("DatabaseManager: Initial data inserted successfully");
  }

  private createIndexes(): void {
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
      this.db.exec(sql);
    }
  }

  private insertInitialData(): void {
    // ロールの初期データ
    const roleCount = this.db
      .prepare("SELECT COUNT(*) as count FROM roles")
      .get() as { count: number };
    if (roleCount.count === 0) {
      this.db.prepare("INSERT INTO roles (id, name) VALUES (1, 'Admin')").run();
      this.db.prepare("INSERT INTO roles (id, name) VALUES (2, 'User')").run();
    }

    // スタッフデータの移行（staffテーブル → usersテーブル）
    this.migrateStaffToUsers();

    // 弁当の初期データ
    const itemCount = this.db
      .prepare("SELECT COUNT(*) as count FROM items")
      .get() as { count: number };
    if (itemCount.count === 0) {
      const itemData = [
        { name: "テスト弁当1", price: 500, display_order: 1 },
        { name: "テスト弁当2", price: 600, display_order: 2 },
      ];

      const insertItem = this.db.prepare(
        "INSERT INTO items (name, price, display_order) VALUES (?, ?, ?)"
      );
      for (const item of itemData) {
        insertItem.run([item.name, item.price, item.display_order]);
      }
    }
  }

  // スタッフデータの移行処理
  private migrateStaffToUsers(): void {
    // 既存のstaffデータをusersテーブルに移行する
    console.log("DatabaseManager: スタッフデータの移行を開始...");

    try {
      // staffテーブルのデータを取得
      const staffMembers = this.all("SELECT * FROM staff WHERE is_active = 1");

      for (const staff of staffMembers) {
        // 同名のユーザーが既に存在するかチェック
        const existingUser = this.get("SELECT id FROM users WHERE name = ?", [
          staff.name,
        ]);

        if (!existingUser) {
          // 存在しない場合は新規作成
          const defaultEmail = `${staff.name.replace(/\s+/g, "")}@ooms.local`;
          const defaultPassword = bcrypt.hashSync("staff123", 10); // 同期版使用

          this.run(
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

  // better-sqlite3用の同期メソッド
  private run(
    sql: string,
    params: any[] = []
  ): { lastInsertRowid?: number; changes?: number } {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);
      return {
        lastInsertRowid: result.lastInsertRowid as number,
        changes: result.changes,
      };
    } catch (error) {
      console.error("SQL実行エラー:", error, "SQL:", sql, "Params:", params);
      throw error;
    }
  }

  private get(sql: string, params: any[] = []): any {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(params);
    } catch (error) {
      console.error("SQL取得エラー:", error, "SQL:", sql, "Params:", params);
      throw error;
    }
  }

  private all(sql: string, params: any[] = []): any[] {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      console.error("SQL全取得エラー:", error, "SQL:", sql, "Params:", params);
      throw error;
    }
  }

  // テスト用デバッグメソッド（本番環境では使用しない）
  debugQuery(sql: string, params: any[] = []): any[] {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("debugQuery is only available in test environment");
    }
    return this.all(sql, params);
  }

  // スタッフ関連
  getStaff(): Staff[] {
    // スタッフとしては一般的にrole_id=2のユーザーを返す
    return this.all(
      "SELECT id, name, is_active, display_order FROM users WHERE role_id = 2 ORDER BY display_order, name"
    );
  }

  addStaff(name: string, displayOrder?: number): void {
    // 仕様変更: staffテーブルではなくusersテーブルにスタッフ情報を追加
    // 標準roleId=2（スタッフ）、is_active=1（有効）でユーザーを作成
    const stmt = this.db.prepare(
      "INSERT INTO users (name, email, password_hash, role_id, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const passwordHash = bcrypt.hashSync("password123", 10); // デフォルトパスワード
    const email = `${name.replace(/\s+/g, "")}@ooms.local`; // スペースを除去して簡易メールアドレス生成
    stmt.run(name, email, passwordHash, 2, 1, displayOrder);

    this.addAuditLog(null, "CREATE", "users", null, {
      message: `スタッフ追加: ${name}`,
    });
  }

  updateStaff(
    id: number,
    name: string,
    isActive: number,
    displayOrder?: number
  ): void {
    this.run(
      "UPDATE staff SET name = ?, is_active = ?, display_order = ? WHERE id = ?",
      [name, isActive, displayOrder, id]
    );
  }

  deleteStaff(id: number): void {
    this.run("UPDATE staff SET is_active = 0 WHERE id = ?", [id]);
  }

  // 弁当関連
  getItems(): Item[] {
    const items = this.all(
      "SELECT * FROM items WHERE is_active = 1 ORDER BY display_order, name"
    );

    // 各アイテムのオプションを取得
    for (const item of items) {
      item.options = this.all("SELECT * FROM item_options WHERE item_id = ?", [
        item.id,
      ]);
    }

    return items;
  }

  addItem(name: string, price: number, displayOrder?: number): void {
    this.run(
      "INSERT INTO items (name, price, display_order) VALUES (?, ?, ?)",
      [name, price, displayOrder]
    );
  }

  updateItem(
    id: number,
    name: string,
    price: number,
    isActive: number,
    displayOrder?: number
  ): void {
    this.run(
      "UPDATE items SET name = ?, price = ?, is_active = ?, display_order = ? WHERE id = ?",
      [name, price, isActive, displayOrder, id]
    );
  }

  deleteItem(id: number): void {
    this.run("UPDATE items SET is_active = 0 WHERE id = ?", [id]);
  }

  // 注文関連
  getOrdersByDate(date: string): OrderView[] {
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

    const rows = this.all(sql, [date]);
    return rows.map((row) => ({
      ...row,
      options: row.options ? row.options.split(",") : [],
    }));
  }

  addOrder(orderData: NewOrder): void {
    const db = this.db;

    const transaction = db.transaction(() => {
      // 注文を挿入（user_id対応）
      const orderStmt = db.prepare(
        "INSERT INTO orders (order_date, user_id) VALUES (?, ?)"
      );
      const orderResult = orderStmt.run(
        orderData.order_date,
        orderData.user_id
      );
      const orderId = orderResult.lastInsertRowid as number;

      // 監査ログに記録
      const auditStmt = db.prepare(
        "INSERT INTO audit_logs (user_id, action, target_entity, target_id, details) VALUES (?, ?, ?, ?, ?)"
      );
      auditStmt.run(
        orderData.user_id,
        "ORDER_CREATE",
        "orders",
        orderId,
        JSON.stringify({
          order_date: orderData.order_date,
          items_count: orderData.items.length,
        })
      );

      // 注文詳細を挿入
      const orderDetailStmt = db.prepare(
        "INSERT INTO order_details (order_id, item_id, quantity, remarks) VALUES (?, ?, ?, ?)"
      );
      const optionStmt = db.prepare(
        "INSERT INTO order_detail_options (order_detail_id, option_id) VALUES (?, ?)"
      );

      for (const item of orderData.items) {
        const orderDetailResult = orderDetailStmt.run(
          orderId,
          item.item_id,
          item.quantity,
          item.remarks
        );
        const orderDetailId = orderDetailResult.lastInsertRowid as number;

        // オプションがある場合は挿入
        if (item.option_ids && item.option_ids.length > 0) {
          for (const optionId of item.option_ids) {
            optionStmt.run(orderDetailId, optionId);
          }
        }
      }
    });

    transaction();
  }

  deleteOrder(orderId: number): void {
    const db = this.db;

    const transaction = db.transaction(() => {
      // 関連するオプションデータを削除
      const deleteOptionsStmt = db.prepare(
        "DELETE FROM order_detail_options WHERE order_detail_id IN (SELECT id FROM order_details WHERE order_id = ?)"
      );
      deleteOptionsStmt.run(orderId);

      // 注文詳細を削除
      const deleteDetailsStmt = db.prepare(
        "DELETE FROM order_details WHERE order_id = ?"
      );
      deleteDetailsStmt.run(orderId);

      // 注文を削除
      const deleteOrderStmt = db.prepare("DELETE FROM orders WHERE id = ?");
      deleteOrderStmt.run(orderId);
    });

    transaction();
  }

  // 週次レポート
  getWeeklyReport(startDate: string): WeeklyReport {
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
      JOIN users u ON o.user_id = u.id
      WHERE o.order_date BETWEEN ? AND ?
        AND u.is_active = 1
      GROUP BY o.order_date, i.name
      ORDER BY i.display_order, i.name, o.order_date
    `;

    const rows = this.all(sql, [startDate, endDate]);

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
  getMonthlyReport(month: string): MonthlyReport {
    const sql = `
      SELECT 
        u.name as staff_name,
        SUM(od.quantity * i.price) as total_amount
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_details od ON o.id = od.order_id
      JOIN items i ON od.item_id = i.id
      WHERE strftime('%Y-%m', o.order_date) = ?
        AND u.is_active = 1
      GROUP BY u.id, u.name
      ORDER BY u.display_order, u.name
    `;

    const rows = this.all(sql, [month]);

    // 月次締め状況を確認
    const lockStatus = this.get(
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
  lockMonth(year: number, month: number, userId: number): void {
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
    const lockTimestamp = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      // 対象月の全注文をロック
      this.run(
        `UPDATE orders 
         SET status = 'locked', locked_at = ?, locked_by_user_id = ? 
         WHERE strftime('%Y-%m', order_date) = ? AND status = 'open'`,
        [lockTimestamp, userId, monthStr]
      );

      // 監査ログに記録
      this.addAuditLog(userId, "MONTH_LOCK", "orders", null, {
        month: monthStr,
        locked_at: lockTimestamp,
      });
    });

    transaction();
  }

  // ユーザー固有の注文取得（セルフサービス対応）
  getOrdersByUser(
    userId: number,
    dateFrom?: string,
    dateTo?: string
  ): OrderView[] {
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

    const rows = this.all(sql, params);
    return rows.map((row) => ({
      ...row,
      options: row.options ? row.options.split(",") : [],
    }));
  }

  // 注文キャンセル（ロック済みは不可）
  cancelOrder(orderId: number, userId: number): void {
    // 注文の存在確認とロック状態チェック
    const order = this.get(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [orderId, userId]
    );

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.status === "locked") {
      throw new Error("ORDER_LOCKED");
    }

    const transaction = this.db.transaction(() => {
      // 注文詳細オプションを削除
      this.run(
        `DELETE FROM order_detail_options 
         WHERE order_detail_id IN (
           SELECT id FROM order_details WHERE order_id = ?
         )`,
        [orderId]
      );

      // 注文詳細を削除
      this.run("DELETE FROM order_details WHERE order_id = ?", [orderId]);

      // 注文を削除
      this.run("DELETE FROM orders WHERE id = ?", [orderId]);

      // 監査ログに記録
      this.addAuditLog(userId, "ORDER_CANCEL", "orders", orderId, {
        order_date: order.order_date,
      });
    });

    transaction();
  }

  // 週間注文保存（洗い替え方式）
  saveWeeklyOrders(payload: WeeklySavePayload): void {
    const { orders, staffIdsOnScreen, weekStart, weekEnd } = payload;

    // トランザクション開始
    const transaction = this.db.transaction(() => {
      // ステップ1：指定された週の範囲の既存注文IDをすべて取得（すべてのスタッフ対象）
      const allExistingOrderIds = this.all(
        `SELECT id FROM orders WHERE order_date BETWEEN ? AND ?`,
        [weekStart, weekEnd]
      );

      if (allExistingOrderIds.length > 0) {
        const idsToDelete = allExistingOrderIds.map((row) => row.id);

        console.log(
          `週間注文保存: ${weekStart} から ${weekEnd} の既存注文 ${idsToDelete.length} 件を削除します`
        );

        // ステップ2：既存の注文を、関連テーブルから順番に「すべて削除」する
        // 2-1. 注文詳細オプションを削除
        this.run(
          `DELETE FROM order_detail_options 
           WHERE order_detail_id IN (
             SELECT id FROM order_details WHERE order_id IN (${idsToDelete
               .map(() => "?")
               .join(",")})
           )`,
          idsToDelete
        );

        // 2-2. 注文詳細を削除
        this.run(
          `DELETE FROM order_details WHERE order_id IN (${idsToDelete
            .map(() => "?")
            .join(",")})`,
          idsToDelete
        );

        // 2-3. 注文を削除
        this.run(
          `DELETE FROM orders WHERE id IN (${idsToDelete
            .map(() => "?")
            .join(",")})`,
          idsToDelete
        );

        console.log(
          `週間注文保存: 既存注文データ ${idsToDelete.length} 件を削除しました`
        );
      }

      // ステップ3：アクティブなスタッフの新しい注文データのみを挿入
      // staff_id と order_date で注文をグループ化
      const ordersToCreate: {
        [key: string]: {
          staff_id: number;
          order_date: string;
          details: { item_id: number; quantity: number }[];
        };
      } = {};

      // 新しい注文データを処理する前に、スタッフがアクティブかどうか確認
      const activeStaffIds = new Set(
        this.all("SELECT id FROM users WHERE is_active = 1").map(
          (row) => row.id
        )
      );

      for (const order of orders) {
        // 削除されたスタッフの注文データはスキップ
        if (!activeStaffIds.has(order.staff_id)) {
          console.log(
            `週間注文保存: 削除されたスタッフ (ID: ${order.staff_id}) の注文データをスキップします`
          );
          continue;
        }

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
      let insertedOrdersCount = 0;
      for (const key in ordersToCreate) {
        const order = ordersToCreate[key];

        const result = this.run(
          "INSERT INTO orders (order_date, user_id) VALUES (?, ?)",
          [order.order_date, order.staff_id]
        );
        const newOrderId = result.lastInsertRowid as number;

        for (const detail of order.details) {
          this.run(
            "INSERT INTO order_details (order_id, item_id, quantity) VALUES (?, ?, ?)",
            [newOrderId, detail.item_id, detail.quantity]
          );
        }
        insertedOrdersCount++;
      }

      console.log(
        `週間注文保存: 新しい注文データ ${insertedOrdersCount} 件を挿入しました`
      );
    });

    // トランザクション実行
    try {
      transaction();
      console.log(
        "週間注文を正常に保存しました。削除されたスタッフのデータは除外されました。"
      );
    } catch (error) {
      console.error("週間注文の保存に失敗しました:", error);
      throw error;
    }
  }

  // 設定関連
  getSettings(): Settings {
    const rows = this.all("SELECT key, value FROM settings");
    const settings: Settings = {};

    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return settings;
  }

  saveSettings(settings: Settings): void {
    const db = this.db;

    const transaction = db.transaction(() => {
      const settingStmt = db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
      );

      for (const key of Object.keys(settings)) {
        const value = settings[key];
        settingStmt.run(key, value);
      }
    });

    transaction();
  }

  // 認証・ユーザー関連（設計書Ver.5.0準拠）
  async login(email: string, password: string): Promise<User> {
    const user = this.get(
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
    this.addAuditLog(user.id, "USER_LOGIN", "users", user.id, {
      email: email,
      timestamp: new Date().toISOString(),
    });

    return userWithoutPassword;
  }

  getCurrentUser(userId: number): User {
    const user = this.get(
      "SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = 1",
      [userId]
    );

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  getUsers(): User[] {
    const users = this.all(
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

    this.run(
      "INSERT INTO users (name, email, password_hash, role_id, display_order) VALUES (?, ?, ?, ?, ?)",
      [name, email, passwordHash, roleId, displayOrder]
    );

    // 監査ログに記録
    this.addAuditLog(null, "USER_CREATE", "users", null, {
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
    const oldUser = this.get("SELECT * FROM users WHERE id = ?", [id]);

    this.run(
      "UPDATE users SET name = ?, email = ?, role_id = ?, is_active = ?, display_order = ? WHERE id = ?",
      [name, email, roleId, isActive, displayOrder, id]
    );

    // 監査ログに記録
    this.addAuditLog(null, "USER_UPDATE", "users", id, {
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

  deleteUser(id: number): void {
    const user = this.get("SELECT * FROM users WHERE id = ?", [id]);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    // ユーザーの注文データを確認
    const orderCheck = this.checkUserHasOrders(id);

    // トランザクション開始
    const transaction = this.db.transaction(() => {
      if (orderCheck.hasOrders) {
        // 注文データが存在する場合の処理
        console.log(
          `警告: ユーザー ${user.name} (ID: ${id}) には ${orderCheck.count} 件の注文データがあります`
        );

        // 1. 関連する注文データを段階的に削除
        // 1-1. 注文詳細オプションを削除
        this.run(
          `
          DELETE FROM order_detail_options 
          WHERE order_detail_id IN (
            SELECT od.id FROM order_details od 
            JOIN orders o ON od.order_id = o.id 
            WHERE o.user_id = ?
          )
        `,
          [id]
        );

        // 1-2. 注文詳細を削除
        this.run(
          `
          DELETE FROM order_details 
          WHERE order_id IN (
            SELECT id FROM orders WHERE user_id = ?
          )
        `,
          [id]
        );

        // 1-3. 注文を削除
        this.run("DELETE FROM orders WHERE user_id = ?", [id]);

        console.log(
          `削除完了: ユーザー ${user.name} の注文データ ${orderCheck.count} 件を削除しました`
        );
      }

      // 2. ユーザーを論理削除（is_activeを0に設定）
      this.run("UPDATE users SET is_active = 0 WHERE id = ?", [id]);

      // 3. 監査ログに記録
      this.addAuditLog(null, "USER_DELETE_WITH_ORDERS", "users", id, {
        deleted_user: user,
        had_orders: orderCheck.hasOrders,
        order_count: orderCheck.count,
        orders_deleted: orderCheck.hasOrders,
      });
    });

    // トランザクション実行
    transaction();

    console.log(`ユーザー削除完了: ${user.name} (ID: ${id})`);
  }

  // 監査ログ関連
  addAuditLog(
    userId: number | null,
    action: string,
    targetEntity: string,
    targetId: number | null,
    details: any
  ): void {
    this.run(
      "INSERT INTO audit_logs (user_id, action, target_entity, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, action, targetEntity, targetId, JSON.stringify(details)]
    );
  }

  getAuditLogs(
    filters: {
      userId?: number;
      action?: string;
      targetEntity?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): { logs: AuditLog[]; total: number } {
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
    const totalResult = this.get(
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

    const logs = this.all(
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

  // ユーザーが注文データを持っているかチェック
  checkUserHasOrders(userId: number): { hasOrders: boolean; count: number } {
    const result = this.get(
      "SELECT COUNT(*) as count FROM orders WHERE user_id = ?",
      [userId]
    ) as { count: number };

    return {
      hasOrders: result.count > 0,
      count: result.count,
    };
  }

  // データベースを閉じる
  close(): void {
    // 既にDBハンドルがない（＝閉じているか、閉じる処理中）場合は、何もせず正常終了
    if (!this.db) {
      console.log("データベースは既に閉じられています");
      return;
    }

    // ★重要：先にインスタンス変数を null 化することで、後続の close 呼び出しを即座に終了させる
    const dbToClose = this.db;
    this.db = null!; // null! は「ここにはnullが入らない」というTypeScriptへの意思表示
    DatabaseManager.instance = null;

    console.log("データベースの切断処理を開始します...");
    try {
      dbToClose.close();
      console.log("データベースを正常に切断しました");
    } catch (err) {
      console.error("データベース切断エラー:", err);
      // エラーが発生しても、アプリケーションは終了処理を続ける
    }
  }

  // データベースを完全にリセットする（開発用）
  private dropAllTables(): void {
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
      this.db.exec(sql);
    }
  }

  // 強制的にデータベースを再初期化
  public forceReinitialize(): void {
    try {
      this.dropAllTables();
      this.initializeDatabase();
      console.log("データベースを再初期化しました");
    } catch (error) {
      console.error("データベース再初期化エラー:", error);
    }
  }

  // テスト用: シングルトンインスタンスをリセット
  public static resetInstance(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.db?.close();
    }
    DatabaseManager.instance = null;
  }

  // 週間の注文データを取得（WeeklyOrderPage用）
  getOrdersForWeek(startDate: string): WeeklyOrderData[] {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const endDate = end.toISOString().split("T")[0];

    const sql = `
      SELECT
        o.user_id as staff_id,
        o.order_date,
        od.item_id,
        od.quantity,
        o.status
      FROM orders o
      JOIN order_details od ON o.id = od.order_id
      JOIN users u ON o.user_id = u.id
      WHERE o.order_date BETWEEN ? AND ? 
        AND u.is_active = 1
      ORDER BY o.order_date, o.user_id
    `;

    return this.all(sql, [startDate, endDate]);
  } // 指定された週の注文をロックする
  lockOrdersForWeek(weekStart: string, weekEnd: string): void {
    console.log(
      `データベース: 週の注文をロック中 (${weekStart} から ${weekEnd})`
    );
    const sql = `
      UPDATE orders
      SET status = 'locked', locked_at = datetime('now')
      WHERE order_date BETWEEN ? AND ? AND status = 'open'
    `;

    const result = this.run(sql, [weekStart, weekEnd]);
    console.log(`ロック結果: ${result.changes}件の注文をロックしました`);
  }

  // 指定された週の注文のロックを解除する
  unlockOrdersForWeek(weekStart: string, weekEnd: string): void {
    console.log(
      `データベース: 週の注文のロックを解除中 (${weekStart} から ${weekEnd})`
    );
    const sql = `
      UPDATE orders
      SET status = 'open', locked_at = NULL
      WHERE order_date BETWEEN ? AND ? AND status = 'locked'
    `;

    const result = this.run(sql, [weekStart, weekEnd]);
    console.log(
      `ロック解除結果: ${result.changes}件の注文のロックを解除しました`
    );
  }
}
