/**
 * スタッフ削除機能の動作確認テスト
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { DatabaseManager, User } from "../main/database";

describe("スタッフ削除機能テスト", () => {
  let db: DatabaseManager;
  const testDbPath = ":memory:";

  beforeAll(async () => {
    db = await DatabaseManager.getInstance(testDbPath);
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  it("deleteUserで論理削除が正常に動作する", async () => {
    // テストユーザーを追加
    await db.addUser(
      "削除テストユーザー",
      "test@delete.local",
      "password123",
      2,
      1
    );

    // 追加されたユーザーを取得
    const users = await db.getUsers();
    const testUser = users.find((u) => u.name === "削除テストユーザー");
    expect(testUser).toBeDefined();
    expect(testUser!.is_active).toBe(1);

    console.info("削除前のユーザー:", {
      id: testUser!.id,
      name: testUser!.name,
      is_active: testUser!.is_active,
    });

    // ユーザーを削除（論理削除）
    await db.deleteUser(testUser!.id);

    // 削除後の状況を確認
    const usersAfterDelete = await db.getUsers();
    const deletedUser = usersAfterDelete.find((u) => u.id === testUser!.id);

    // getUsers()はis_active=1のみを返すので、削除されたユーザーは含まれない
    expect(deletedUser).toBeUndefined();

    // 直接データベースを確認して、論理削除されていることを確認
    const userInDb = await db.debugQuery("SELECT * FROM users WHERE id = ?", [
      testUser!.id,
    ]);
    expect(userInDb.length).toBe(1);
    expect(userInDb[0].is_active).toBe(0); // 論理削除されている

    console.info("削除後のユーザー（DB直接確認）:", userInDb[0]);

    console.info("✅ 論理削除が正常に動作しました");
  });

  it("AppContextのrefreshStaffが正しくフィルタリングする", async () => {
    // 複数のユーザーを追加（アクティブと非アクティブ）
    await db.addUser(
      "アクティブユーザー",
      "active@test.local",
      "password123",
      2,
      1
    );
    await db.addUser(
      "非アクティブユーザー",
      "inactive@test.local",
      "password123",
      2,
      2
    );

    // 非アクティブユーザーを無効化
    const users = await db.getUsers();
    const inactiveUser = users.find((u) => u.name === "非アクティブユーザー");
    await db.deleteUser(inactiveUser!.id);

    // AppContextのrefreshStaffと同じロジックを実行
    const allUsers: User[] = await db.getUsers();
    const staffData = allUsers
      .filter((user: User) => user.is_active)
      .map((user: User) => ({
        id: user.id,
        name: user.name,
        is_active: user.is_active,
        display_order: user.display_order || 999,
      }))
      .sort((a, b) => a.display_order - b.display_order);

    console.info("フィルタリング後のスタッフリスト:", staffData);

    // アクティブなユーザーのみが含まれることを確認
    expect(staffData.every((staff) => staff.is_active === 1)).toBe(true);
    expect(
      staffData.find((staff) => staff.name === "非アクティブユーザー")
    ).toBeUndefined();
    expect(
      staffData.find((staff) => staff.name === "アクティブユーザー")
    ).toBeDefined();

    console.info("✅ AppContextのフィルタリングロジックが正常に動作しました");
  });
});
