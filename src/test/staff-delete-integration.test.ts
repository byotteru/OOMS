/**
 * スタッフ削除機能の統合テスト
 * フロントエンドからバックエンドまでの全体フローを確認
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { DatabaseManager } from "../main/database";

describe("スタッフ削除統合テスト", () => {
  let db: DatabaseManager;
  const testDbPath = ":memory:";

  beforeAll(() => {
    db = DatabaseManager.getInstance(testDbPath);
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  it("スタッフ削除の全体フローが正常に動作する", () => {
    console.info("=== スタッフ削除統合テスト開始 ===");

    // 1. テストスタッフを追加
    console.info("ステップ1: テストスタッフを追加");
    db.addUser("削除テストスタッフ", "delete@test.com", "password123", 2, 1);

    // 2. 初期状態の確認
    console.info("ステップ2: 初期状態の確認");
    const initialUsers = db.getUsers();
    const targetStaff = initialUsers.find(
      (u) => u.name === "削除テストスタッフ"
    );

    console.info("追加されたスタッフ:", {
      id: targetStaff?.id,
      name: targetStaff?.name,
      is_active: targetStaff?.is_active,
    });

    expect(targetStaff).toBeDefined();
    expect(targetStaff!.is_active).toBe(1);

    // 3. AppContextのrefreshStaffロジックをシミュレート（削除前）
    console.info(
      "ステップ3: AppContext.refreshStaffロジックをシミュレート（削除前）"
    );
    const usersBeforeDelete = db.getUsers();
    const staffListBeforeDelete = usersBeforeDelete
      .filter((user) => user.is_active)
      .map((user) => ({
        id: user.id,
        name: user.name,
        is_active: user.is_active,
        display_order: user.display_order || 999,
      }))
      .sort((a, b) => a.display_order - b.display_order);

    console.info("削除前のスタッフリスト:", staffListBeforeDelete);
    const staffBeforeDelete = staffListBeforeDelete.find(
      (s) => s.name === "削除テストスタッフ"
    );
    expect(staffBeforeDelete).toBeDefined();

    // 4. StaffMasterPage.handleDeleteStaffロジックをシミュレート
    console.info(
      "ステップ4: StaffMasterPage.handleDeleteStaffロジックをシミュレート"
    );

    // window.api.deleteUser(staff.id) の部分をシミュレート
    db.deleteUser(targetStaff!.id);
    console.info("✅ deleteUser呼び出し完了");

    // 5. AppContextのrefreshStaffロジックをシミュレート（削除後）
    console.info(
      "ステップ5: AppContext.refreshStaffロジックをシミュレート（削除後）"
    );
    const usersAfterDelete = db.getUsers();
    const staffListAfterDelete = usersAfterDelete
      .filter((user) => user.is_active)
      .map((user) => ({
        id: user.id,
        name: user.name,
        is_active: user.is_active,
        display_order: user.display_order || 999,
      }))
      .sort((a, b) => a.display_order - b.display_order);

    console.info("削除後のスタッフリスト:", staffListAfterDelete);

    // 6. 削除されたスタッフが表示されないことを確認
    const staffAfterDelete = staffListAfterDelete.find(
      (s) => s.name === "削除テストスタッフ"
    );
    expect(staffAfterDelete).toBeUndefined();

    // 7. データベースレベルでの確認（論理削除されているが物理的には存在）
    console.info("ステップ6: データベースレベルでの確認");
    const allUsersInDb = db.debugQuery("SELECT * FROM users WHERE name = ?", [
      "削除テストスタッフ",
    ]);
    expect(allUsersInDb.length).toBe(1);
    expect(allUsersInDb[0].is_active).toBe(0);

    console.info("データベース内のユーザー状態:", {
      id: allUsersInDb[0].id,
      name: allUsersInDb[0].name,
      is_active: allUsersInDb[0].is_active,
    });

    console.info("✅ スタッフ削除の全体フローが正常に動作しました");
  });

  it("複数スタッフでの削除後フィルタリングテスト", async () => {
    console.info("=== 複数スタッフでの削除テスト開始 ===");

    // 複数のスタッフを追加
    await db.addUser("スタッフA", "staffa@test.com", "password123", 2, 1);
    await db.addUser("スタッフB", "staffb@test.com", "password123", 2, 2);
    await db.addUser("スタッフC", "staffc@test.com", "password123", 2, 3);

    // 初期状態の確認
    const initialUsers = await db.getUsers();
    const staffABC = initialUsers.filter((u) => u.name.startsWith("スタッフ"));
    console.info("追加されたスタッフ数:", staffABC.length);
    expect(staffABC.length).toBe(3);

    // スタッフBを削除
    const staffB = staffABC.find((s) => s.name === "スタッフB");
    await db.deleteUser(staffB!.id);

    // 削除後のフィルタリング確認
    const usersAfterDelete = await db.getUsers();
    const remainingStaff = usersAfterDelete
      .filter((user) => user.is_active && user.name.startsWith("スタッフ"))
      .map((user) => ({
        id: user.id,
        name: user.name,
        is_active: user.is_active,
        display_order: user.display_order || 999,
      }))
      .sort((a, b) => a.display_order - b.display_order);

    console.info(
      "削除後の残りスタッフ:",
      remainingStaff.map((s) => s.name)
    );

    // スタッフAとCのみが残り、Bは表示されないことを確認
    expect(remainingStaff.length).toBe(2);
    expect(remainingStaff.find((s) => s.name === "スタッフA")).toBeDefined();
    expect(remainingStaff.find((s) => s.name === "スタッフC")).toBeDefined();
    expect(remainingStaff.find((s) => s.name === "スタッフB")).toBeUndefined();

    console.info("✅ 複数スタッフでの削除後フィルタリングが正常に動作しました");
  });
});
