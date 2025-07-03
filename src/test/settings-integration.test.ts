/* 設定データの保存・取得テスト */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseManager } from "../main/database";
import fs from "fs";
import path from "path";

describe("設定データ管理テスト", () => {
  let dbManager: DatabaseManager;
  let testDbPath: string;

  beforeEach(async () => {
    testDbPath = path.join(__dirname, `test_settings_${Date.now()}.db`);
    dbManager = await DatabaseManager.getInstance(testDbPath);
  });

  afterEach(async () => {
    if (dbManager) {
      await dbManager.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it("設定データの保存・取得が正しく動作する", async () => {
    // テスト用設定データ
    const testSettings = {
      garden_name: "さくら保育園",
      garden_address: "〒100-0001 東京都千代田区千代田1-1-1",
      supplier_name: "株式会社テストフード",
      supplier_address: "〒100-0002 東京都千代田区千代田2-2-2",
      supplier_phone: "03-1234-5678",
    };

    console.log("テスト設定データ:", testSettings);

    // 設定を保存
    await dbManager.saveSettings(testSettings);
    console.log("✅ 設定データの保存完了");

    // 設定を取得
    const retrievedSettings = await dbManager.getSettings();
    console.log("取得した設定データ:", retrievedSettings);

    // 保存したデータが正しく取得できることを確認
    expect(retrievedSettings.garden_name).toBe(testSettings.garden_name);
    expect(retrievedSettings.garden_address).toBe(testSettings.garden_address);
    expect(retrievedSettings.supplier_name).toBe(testSettings.supplier_name);
    expect(retrievedSettings.supplier_address).toBe(
      testSettings.supplier_address
    );
    expect(retrievedSettings.supplier_phone).toBe(testSettings.supplier_phone);

    console.log("✅ 設定データの保存・取得テストが正常に完了しました");
  });

  it("部分的な設定更新が正しく動作する", async () => {
    // 初期設定
    const initialSettings = {
      garden_name: "初期保育園",
      supplier_name: "初期業者",
    };

    await dbManager.saveSettings(initialSettings);
    console.log("初期設定保存完了:", initialSettings);

    // 部分的な更新
    const partialUpdate = {
      garden_name: "更新後保育園",
      garden_address: "〒100-0003 東京都千代田区千代田3-3-3",
    };

    await dbManager.saveSettings(partialUpdate);
    console.log("部分更新完了:", partialUpdate);

    // 更新後のデータを確認
    const updatedSettings = await dbManager.getSettings();
    console.log("更新後の設定:", updatedSettings);

    // 更新されたフィールドの確認
    expect(updatedSettings.garden_name).toBe("更新後保育園");
    expect(updatedSettings.garden_address).toBe(
      "〒100-0003 東京都千代田区千代田3-3-3"
    );

    // 初期の supplier_name は残っているか確認（更新していないフィールド）
    expect(updatedSettings.supplier_name).toBe("初期業者");

    console.log("✅ 部分的な設定更新テストが正常に完了しました");
  });

  it("WeeklyReportPageで使用する設定フィールドが利用可能", async () => {
    // WeeklyReportPageで使用される設定項目をテスト
    const reportSettings = {
      garden_name: "発注元施設",
      garden_address: "発注元住所",
      supplier_name: "発注先業者",
    };

    await dbManager.saveSettings(reportSettings);
    const retrievedSettings = await dbManager.getSettings();

    // WeeklyReportPageで参照される項目の確認
    expect(retrievedSettings.garden_name).toBe("発注元施設");
    expect(retrievedSettings.supplier_name).toBe("発注先業者");
    expect(retrievedSettings.garden_address).toBe("発注元住所");

    console.log("WeeklyReportPage用設定フィールド:", {
      発注元: retrievedSettings.garden_name,
      宛先: retrievedSettings.supplier_name,
      住所: retrievedSettings.garden_address,
    });

    console.log(
      "✅ WeeklyReportPage用設定フィールドテストが正常に完了しました"
    );
  });
});
