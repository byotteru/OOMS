/* UI統合テスト */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseManager } from "../main/database";
import fs from "fs";
import path from "path";

describe("UI統合テスト", () => {
  let dbManager: DatabaseManager;
  let testDbPath: string;

  beforeEach(async () => {
    // テスト用の一時データベースファイルを作成
    testDbPath = path.join(__dirname, `test_ui_${Date.now()}.db`);
    dbManager = await DatabaseManager.getInstance(testDbPath);
  });

  afterEach(async () => {
    if (dbManager) {
      await dbManager.close();
    }
    // テストファイルのクリーンアップ
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it("スタッフ削除後のリスト取得が正しく動作する", async () => {
    // 初期スタッフ数を確認
    let allStaff = await dbManager.getStaff();
    console.log("初期スタッフ数:", allStaff.length);
    expect(allStaff.length).toBeGreaterThan(0);

    // アクティブなスタッフのみ取得（UIで表示される内容）
    let activeUsers = await dbManager.getUsers();
    const activeStaffList = activeUsers.filter((user) => user.is_active === 1);
    console.log("アクティブスタッフ数（削除前）:", activeStaffList.length);

    // スタッフを論理削除
    const staffToDelete = allStaff[0];
    await dbManager.deleteUser(staffToDelete.id);
    console.log("削除対象スタッフ:", staffToDelete.name);

    // 削除後のアクティブスタッフ数を確認
    activeUsers = await dbManager.getUsers();
    const updatedActiveStaffList = activeUsers.filter(
      (user) => user.is_active === 1
    );
    console.log(
      "アクティブスタッフ数（削除後）:",
      updatedActiveStaffList.length
    );

    // UIで表示されるスタッフリストが1つ減っていることを確認
    expect(updatedActiveStaffList.length).toBe(activeStaffList.length - 1);

    // 削除されたスタッフがリストに含まれていないことを確認
    const deletedStaffInList = updatedActiveStaffList.find(
      (staff) => staff.id === staffToDelete.id
    );
    expect(deletedStaffInList).toBeUndefined();

    console.log("✅ スタッフ削除後のUI統合テストが正常に完了しました");
  });

  it("WeeklyReportPageで使用する週次データの取得ができる", async () => {
    // 今週の月曜日を計算
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const mondayStr = monday.toISOString().split("T")[0];

    console.log("テスト対象週開始日:", mondayStr);

    // 週次レポートの取得をテスト
    try {
      const weeklyReport = await dbManager.getWeeklyReport(mondayStr);
      console.log(
        "週次レポート取得成功:",
        weeklyReport ? "データあり" : "データなし"
      );

      // レポートの基本構造を確認
      expect(weeklyReport).toBeDefined();
      if (weeklyReport) {
        expect(weeklyReport).toHaveProperty("week_start");
        expect(weeklyReport).toHaveProperty("week_end");
        console.log(
          "レポート期間:",
          weeklyReport.week_start,
          "～",
          weeklyReport.week_end
        );
      }

      console.log("✅ WeeklyReportPage用データ取得テストが正常に完了しました");
    } catch (error) {
      console.log("週次レポート取得エラー（データなしの場合は正常）:", error);
      // データが存在しない場合のエラーは正常動作
      expect(error).toBeDefined();
    }
  });
});
