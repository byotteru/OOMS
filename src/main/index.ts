import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { DatabaseManager } from "./database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// グローバル変数
let mainWindow: BrowserWindow;
let dbManager: DatabaseManager | null = null;

// 開発環境かどうかの判定
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

async function createWindow(): Promise<void> {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../../assets/icon.png"), // アイコンファイルがある場合
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: "default",
    autoHideMenuBar: true,
  });

  // 開発環境では開発ツールを開く
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // HTMLファイルを読み込み
  // electron-viteのHMRと開発/本番モードのURLハンドリング
  if (process.env["ELECTRON_RENDERER_URL"]) {
    // 開発モード：Vite開発サーバーのURLを読み込む
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    // 本番モード：ビルドされたindex.htmlを読み込む
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

// メイン関数
async function main(): Promise<void> {
  console.log("Main: Initializing database manager...");
  // データベースマネージャーの初期化
  const dbPath = path.join(app.getPath("userData"), "ooms.db");
  dbManager = await DatabaseManager.getInstance(dbPath);
  console.log("Main: Database manager initialized successfully");

  // IPCハンドラーの設定
  setupIpcHandlers();
  console.log("Main: IPC handlers set up successfully");

  // メインウィンドウを作成
  await createWindow();
  console.log("Main: Main window created successfully");
}

// アプリケーションの初期化
app.whenReady().then(async () => {
  await main();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

// 全てのウィンドウが閉じられたときの処理
app.on("window-all-closed", () => {
  console.log("Window-all-closed: データベースのクローズを開始します...");

  if (dbManager) {
    dbManager
      .close()
      .then(() =>
        console.log(
          "Window-all-closed: データベースのクローズ処理が正常に完了しました。"
        )
      )
      .catch((err) =>
        console.error(
          "Window-all-closed: データベースのクローズ中にエラーが発生しました:",
          err
        )
      );
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// アプリケーション終了前の処理
app.on("before-quit", () => {
  console.log("Before-quit: データベースのクローズを開始します...");

  if (dbManager) {
    dbManager
      .close()
      .then(() =>
        console.log(
          "Before-quit: データベースのクローズ処理が正常に完了しました。"
        )
      )
      .catch((err) =>
        console.error(
          "Before-quit: データベースのクローズ中にエラーが発生しました:",
          err
        )
      );
  }
});

// アプリが終了する直前にデータベース接続を閉じる
app.on("will-quit", () => {
  console.log(
    "Will-quit: アプリ終了処理：データベースのクローズを開始します..."
  );

  // シングルトンのインスタンスが存在する場合のみクローズを試行
  if (DatabaseManager.hasInstance()) {
    DatabaseManager.getInstance()
      .then((dbManager) => dbManager.close())
      .then(() =>
        console.log(
          "Will-quit: データベースのクローズ処理が正常に完了しました。"
        )
      )
      .catch((err) =>
        console.error(
          "Will-quit: データベースのクローズ中に致命的なエラーが発生しました:",
          err
        )
      );
  } else {
    console.log(
      "Will-quit: データベースインスタンスが存在しないため、クローズ処理をスキップします。"
    );
  }
});

// IPCハンドラーの設定
function setupIpcHandlers(): void {
  // データベースマネージャーが利用可能であることを確認するヘルパー関数
  function ensureDbManager(): DatabaseManager {
    if (!dbManager) {
      throw new Error("データベースマネージャーが初期化されていません");
    }
    return dbManager;
  }

  // スタッフ関連
  ipcMain.handle("get-staff", async () => {
    try {
      const db = ensureDbManager();
      return await db.getStaff();
    } catch (error) {
      console.error("スタッフ取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "add-staff",
    async (_, name: string, displayOrder?: number) => {
      try {
        const db = ensureDbManager();
        await db.addStaff(name, displayOrder);
      } catch (error) {
        console.error("スタッフ追加エラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "update-staff",
    async (
      _,
      id: number,
      name: string,
      isActive: number,
      displayOrder?: number
    ) => {
      try {
        const db = ensureDbManager();
        await db.updateStaff(id, name, isActive, displayOrder);
      } catch (error) {
        console.error("スタッフ更新エラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("delete-staff", async (_, id: number) => {
    try {
      const db = ensureDbManager();
      await db.deleteStaff(id);
    } catch (error) {
      console.error("スタッフ削除エラー:", error);
      throw error;
    }
  });

  // 弁当関連
  ipcMain.handle("get-items", async () => {
    try {
      const db = ensureDbManager();
      return await db.getItems();
    } catch (error) {
      console.error("弁当取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "add-item",
    async (_, name: string, price: number, displayOrder?: number) => {
      try {
        const db = ensureDbManager();
        await db.addItem(name, price, displayOrder);
      } catch (error) {
        console.error("弁当追加エラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "update-item",
    async (
      _,
      id: number,
      name: string,
      price: number,
      isActive: number,
      displayOrder?: number
    ) => {
      try {
        const db = ensureDbManager();
        await db.updateItem(id, name, price, isActive, displayOrder);
      } catch (error) {
        console.error("弁当更新エラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("delete-item", async (_, id: number) => {
    try {
      const db = ensureDbManager();
      await db.deleteItem(id);
    } catch (error) {
      console.error("弁当削除エラー:", error);
      throw error;
    }
  });

  // 注文関連
  ipcMain.handle("get-orders-by-date", async (_, date: string) => {
    try {
      const db = ensureDbManager();
      return await db.getOrdersByDate(date);
    } catch (error) {
      console.error("注文取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle("add-order", async (_, orderData) => {
    try {
      const db = ensureDbManager();
      await db.addOrder(orderData);
    } catch (error) {
      console.error("注文追加エラー:", error);
      throw error;
    }
  });

  ipcMain.handle("delete-order", async (_, orderId: number) => {
    try {
      const db = ensureDbManager();
      await db.deleteOrder(orderId);
    } catch (error) {
      console.error("注文削除エラー:", error);
      throw error;
    }
  });

  // レポート関連
  ipcMain.handle("get-weekly-report", async (_, startDate: string) => {
    try {
      const db = ensureDbManager();
      return await db.getWeeklyReport(startDate);
    } catch (error) {
      console.error("週次レポート取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle("get-monthly-report", async (_, month: string) => {
    try {
      const db = ensureDbManager();
      return await db.getMonthlyReport(month);
    } catch (error) {
      console.error("月次レポート取得エラー:", error);
      throw error;
    }
  });

  // 設定関連
  ipcMain.handle("get-settings", async () => {
    try {
      const db = ensureDbManager();
      return await db.getSettings();
    } catch (error) {
      console.error("設定取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle("save-settings", async (_, settings) => {
    try {
      const db = ensureDbManager();
      await db.saveSettings(settings);
    } catch (error) {
      console.error("設定保存エラー:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "show-error-dialog",
    async (_, title: string, message: string) => {
      try {
        await dialog.showMessageBox(mainWindow, {
          type: "error",
          title: title,
          message: message,
          buttons: ["OK"],
        });
      } catch (error) {
        console.error("エラーダイアログ表示エラー:", error);
      }
    }
  );

  ipcMain.handle(
    "show-info-dialog",
    async (_, title: string, message: string) => {
      try {
        await dialog.showMessageBox(mainWindow, {
          type: "info",
          title: title,
          message: message,
          buttons: ["OK"],
        });
      } catch (error) {
        console.error("情報ダイアログ表示エラー:", error);
      }
    }
  );

  ipcMain.handle("export-csv", async (_, data: any[], filename: string) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: [
          { name: "CSV Files", extensions: ["csv"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (!result.canceled && result.filePath) {
        // データをCSV形式に変換
        const csvContent = convertToCSV(data);

        // ファイルに保存
        fs.writeFileSync(result.filePath, csvContent, "utf8");

        await dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "エクスポート完了",
          message: `CSVファイルを保存しました: ${result.filePath}`,
          buttons: ["OK"],
        });
      }
    } catch (error) {
      console.error("CSV エクスポートエラー:", error);
      throw error;
    }
  });

  // 認証関連（設計書Ver.5.0準拠）
  ipcMain.handle("login", async (_, email: string, password: string) => {
    try {
      const db = ensureDbManager();
      return await db.login(email, password);
    } catch (error) {
      console.error("ログインエラー:", error);
      if (error instanceof Error && error.message === "AUTH_FAILED") {
        throw {
          code: "AUTH_FAILED",
          message: "メールアドレスまたはパスワードが正しくありません。",
        };
      }
      throw error;
    }
  });

  ipcMain.handle("get-current-user", async (_, userId: number) => {
    try {
      const db = ensureDbManager();
      return await db.getCurrentUser(userId);
    } catch (error) {
      console.error("現在のユーザー取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle("get-users", async () => {
    try {
      const db = ensureDbManager();
      return await db.getUsers();
    } catch (error) {
      console.error("ユーザー取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "add-user",
    async (
      _,
      name: string,
      email: string,
      password: string,
      roleId: number,
      displayOrder?: number
    ) => {
      try {
        const db = ensureDbManager();
        await db.addUser(name, email, password, roleId, displayOrder);
      } catch (error) {
        console.error("ユーザー追加エラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "update-user",
    async (
      _,
      id: number,
      name: string,
      email: string,
      roleId: number,
      isActive: number,
      displayOrder?: number
    ) => {
      try {
        const db = ensureDbManager();
        await db.updateUser(id, name, email, roleId, isActive, displayOrder);
      } catch (error) {
        console.error("ユーザー更新エラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("delete-user", async (_, id: number) => {
    try {
      const db = ensureDbManager();
      await db.deleteUser(id);
    } catch (error) {
      console.error("ユーザー削除エラー:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "lock-month",
    async (_, year: number, month: number, userId: number) => {
      try {
        const db = ensureDbManager();
        await db.lockMonth(year, month, userId);
      } catch (error) {
        console.error("月次締めエラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("get-audit-logs", async (_, filters = {}) => {
    try {
      const db = ensureDbManager();
      return await db.getAuditLogs(filters);
    } catch (error) {
      console.error("監査ログ取得エラー:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "get-orders-by-user",
    async (_, userId: number, dateFrom?: string, dateTo?: string) => {
      try {
        const db = ensureDbManager();
        return await db.getOrdersByUser(userId, dateFrom, dateTo);
      } catch (error) {
        console.error("ユーザー注文取得エラー:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("cancel-order", async (_, orderId: number, userId: number) => {
    try {
      const db = ensureDbManager();
      await db.cancelOrder(orderId, userId);
    } catch (error) {
      console.error("注文キャンセルエラー:", error);
      throw error;
    }
  });

  // 週間注文関連
  ipcMain.handle("save-weekly-orders", async (_, payload) => {
    try {
      const db = ensureDbManager();
      await db.saveWeeklyOrders(payload);
      return { success: true };
    } catch (error) {
      console.error("週間注文保存エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle("get-orders-for-week", async (_, startDate: string) => {
    try {
      const db = ensureDbManager();
      return await db.getOrdersForWeek(startDate);
    } catch (error) {
      console.error("週間注文データ取得エラー:", error);
      throw error;
    }
  });
}

// データをCSV形式に変換する関数
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  // ヘッダー行を作成
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  // データ行を作成
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // 値にカンマや改行が含まれている場合はクォートで囲む
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes("\n") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || "";
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}
