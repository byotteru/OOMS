/* 設定画面とWeeklyReportPageの連携テスト */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseManager } from "../main/database";
import fs from "fs";
import path from "path";

describe("設定画面とWeeklyReportPageの連携", () => {
  let dbManager: DatabaseManager;
  let testDbPath: string;

  beforeEach(async () => {
    testDbPath = path.join(__dirname, `test_integration_${Date.now()}.db`);
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

  it("設定画面で保存した情報がWeeklyReportPageで正しく表示される", async () => {
    // 1. 設定画面で入力されるであろうデータを保存
    const settingsFromForm = {
      garden_name: "あおぞら保育園",
      garden_address: "〒150-0001 東京都渋谷区神宮前1-1-1",
      supplier_name: "株式会社グリーンフード",
      supplier_address: "〒106-0032 東京都港区六本木2-2-2",
      supplier_phone: "03-9876-5432",
    };

    console.log("=== 設定画面での入力データ ===");
    console.log("施設名（発注元）:", settingsFromForm.garden_name);
    console.log("施設住所:", settingsFromForm.garden_address);
    console.log("発注先名（宛名）:", settingsFromForm.supplier_name);
    console.log("発注先住所:", settingsFromForm.supplier_address);
    console.log("発注先電話:", settingsFromForm.supplier_phone);

    // 2. 設定を保存（SettingsPageの保存処理と同等）
    await dbManager.saveSettings(settingsFromForm);

    // 3. 設定を取得（WeeklyReportPageでの取得処理と同等）
    const retrievedSettings = await dbManager.getSettings();

    console.log("\n=== WeeklyReportPageでの表示予定 ===");
    console.log(
      "宛先:",
      `${retrievedSettings.supplier_name || "（発注先未設定）"} 御中`
    );
    console.log("発注元:", retrievedSettings.garden_name || "（施設名未設定）");
    console.log("発注者:", retrievedSettings.garden_name || "（施設名未設定）");
    if (retrievedSettings.garden_address) {
      console.log("住所:", retrievedSettings.garden_address);
    }

    // 4. WeeklyReportPageで使用される表示形式の検証
    const recipientDisplay = `${
      retrievedSettings.supplier_name || "（発注先未設定）"
    } 御中`;
    const senderDisplay = retrievedSettings.garden_name || "（施設名未設定）";

    expect(recipientDisplay).toBe("株式会社グリーンフード 御中");
    expect(senderDisplay).toBe("あおぞら保育園");
    expect(retrievedSettings.garden_address).toBe(
      "〒150-0001 東京都渋谷区神宮前1-1-1"
    );

    console.log(
      "\n✅ 設定画面とWeeklyReportPageの連携テストが正常に完了しました"
    );
    console.log("📋 発注書に正しく情報が表示されます:");
    console.log(`   宛先: ${recipientDisplay}`);
    console.log(`   発注元: ${senderDisplay}`);
    console.log(`   住所: ${retrievedSettings.garden_address}`);
  });

  it("設定が未入力の場合のデフォルト表示", async () => {
    // 設定を取得（空の状態）
    const emptySettings = await dbManager.getSettings();

    console.log("=== 未設定時のWeeklyReportPage表示 ===");
    const recipientDisplay = `${
      emptySettings.supplier_name || "（発注先未設定）"
    } 御中`;
    const senderDisplay = emptySettings.garden_name || "（施設名未設定）";

    console.log("宛先:", recipientDisplay);
    console.log("発注元:", senderDisplay);

    expect(recipientDisplay).toBe("（発注先未設定） 御中");
    expect(senderDisplay).toBe("（施設名未設定）");

    console.log("✅ 未設定時のデフォルト表示テストが正常に完了しました");
  });
});
