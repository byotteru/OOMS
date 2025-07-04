/* better-sqlite3への移行テスト */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseManager } from "../main/database";
import fs from "fs";
import path from "path";

describe("better-sqlite3移行テスト", () => {
  let dbManager: DatabaseManager;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(__dirname, `test_better_sqlite_${Date.now()}.db`);
    dbManager = DatabaseManager.getInstance(testDbPath);
  });

  afterEach(() => {
    if (dbManager) {
      dbManager.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it("データベースの基本動作が正常に動作する", async () => {
    console.log("=== better-sqlite3移行テスト開始 ===");

    // ユーザー取得テスト（同期化されたメソッド）
    const users = dbManager.getUsers();
    console.log("取得されたユーザー数:", users.length);
    console.log(
      "ユーザー一覧:",
      users.map((u) => u.name)
    );

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);

    // 最初のユーザーが管理者であることを確認
    const adminUser = users.find((u) => u.name === "管理者");
    expect(adminUser).toBeDefined();
    expect(adminUser?.role_name).toBe("Admin");

    console.log("✅ ユーザー取得テストが正常に完了しました");
  });

  it("スタッフ削除機能が正常に動作する", async () => {
    console.log("=== スタッフ削除テスト開始 ===");

    // 削除前のユーザー数
    const usersBefore = dbManager.getUsers();
    const userCountBefore = usersBefore.length;
    console.log("削除前のアクティブユーザー数:", userCountBefore);

    // 管理者以外のユーザーを探す
    const targetUser = usersBefore.find((u) => u.name !== "管理者");
    if (targetUser) {
      console.log("削除対象ユーザー:", targetUser.name);

      // ユーザー削除（論理削除）
      dbManager.deleteUser(targetUser.id);

      // 削除後のユーザー数確認
      const usersAfter = dbManager.getUsers();
      const userCountAfter = usersAfter.length;
      console.log("削除後のアクティブユーザー数:", userCountAfter);

      expect(userCountAfter).toBe(userCountBefore - 1);

      // 削除されたユーザーがリストに含まれていないことを確認
      const deletedUserInList = usersAfter.find((u) => u.id === targetUser.id);
      expect(deletedUserInList).toBeUndefined();

      console.log("✅ スタッフ削除テストが正常に完了しました");
    } else {
      console.log("⚠️ 削除可能なユーザーが見つかりませんでした");
    }
  });

  it("better-sqlite3の同期APIが正常に動作する", async () => {
    console.log("=== 同期API動作テスト開始 ===");

    // 直接SQLクエリの実行テスト
    try {
      // @ts-ignore - プライベートメソッドへのアクセス
      const result = dbManager.get("SELECT COUNT(*) as count FROM users");
      console.log("users テーブルの総レコード数:", result.count);
      expect(typeof result.count).toBe("number");

      // @ts-ignore - プライベートメソッドへのアクセス
      const allUsers = dbManager.all(
        "SELECT name FROM users WHERE is_active = 1"
      );
      console.log(
        "アクティブユーザー名一覧:",
        allUsers.map((u) => u.name)
      );
      expect(Array.isArray(allUsers)).toBe(true);

      console.log("✅ 同期API動作テストが正常に完了しました");
    } catch (error) {
      console.error("同期API動作テストでエラーが発生:", error);
      throw error;
    }
  });

  it("データベース接続の安定性確認", async () => {
    console.log("=== データベース接続安定性テスト開始 ===");

    // 複数回の操作実行
    for (let i = 0; i < 5; i++) {
      const users = dbManager.getUsers();
      expect(users.length).toBeGreaterThan(0);
      console.log(`操作 ${i + 1}/5 完了 - ユーザー数: ${users.length}`);
    }

    console.log("✅ データベース接続安定性テストが正常に完了しました");
  });
});
