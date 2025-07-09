/**
 * スタッフ削除時の注文データ処理修正テスト
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { DatabaseManager, User } from "../main/database";

describe("スタッフ削除時の注文データ処理修正テスト", () => {
  let db: DatabaseManager;
  const testDbPath = ":memory:";

  beforeAll(async () => {
    db = DatabaseManager.getInstance(testDbPath);
  });

  afterAll(async () => {
    if (db) {
      db.close();
    }
  });

  it("スタッフ削除時に関連する注文データが完全に削除される", async () => {
    console.log("=== スタッフ削除時の注文データ処理テスト開始 ===");

    // 1. テストスタッフを追加
    await db.addUser("テストスタッフ", "test@staff.com", "password123", 2, 1);

    // 2. 追加されたスタッフを取得
    const users = await db.getUsers();
    const testUser = users.find((u: User) => u.name === "テストスタッフ");
    expect(testUser).toBeDefined();

    console.log("テストスタッフ:", { id: testUser!.id, name: testUser!.name });

    // 3. 弁当アイテムを追加
    await db.addItem("テスト弁当", 500, 1);
    const items = await db.getItems();
    const testItem = items[0];
    expect(testItem).toBeDefined();

    console.log("テストアイテム:", { id: testItem.id, name: testItem.name });

    // 4. テストスタッフで注文を作成
    const orderData = {
      order_date: "2025-01-15",
      user_id: testUser!.id,
      items: [
        {
          item_id: testItem.id,
          quantity: 2,
          remarks: "テスト注文",
        },
      ],
    };

    await db.addOrder(orderData);
    console.log("テスト注文を作成しました");

    // 5. 注文データが存在することを確認
    const orderCheck = await db.checkUserHasOrders(testUser!.id);
    expect(orderCheck.hasOrders).toBe(true);
    expect(orderCheck.count).toBe(1);

    console.log("削除前の注文データ:", {
      hasOrders: orderCheck.hasOrders,
      count: orderCheck.count,
    });

    // 6. スタッフを削除
    await db.deleteUser(testUser!.id);
    console.log("スタッフを削除しました");

    // 7. 削除後の確認
    const orderCheckAfterDelete = await db.checkUserHasOrders(testUser!.id);
    expect(orderCheckAfterDelete.hasOrders).toBe(false);
    expect(orderCheckAfterDelete.count).toBe(0);

    console.log("削除後の注文データ:", {
      hasOrders: orderCheckAfterDelete.hasOrders,
      count: orderCheckAfterDelete.count,
    });

    // 8. スタッフが非アクティブになっていることを確認
    const allUsers = await db.debugQuery("SELECT * FROM users WHERE id = ?", [
      testUser!.id,
    ]);
    expect(allUsers.length).toBe(1);
    expect(allUsers[0].is_active).toBe(0);

    console.log("削除後のスタッフ状態:", {
      id: allUsers[0].id,
      name: allUsers[0].name,
      is_active: allUsers[0].is_active,
    });

    // 9. getUsers()で取得されないことを確認
    const activeUsers = await db.getUsers();
    const deletedUserInList = activeUsers.find(
      (u: User) => u.id === testUser!.id
    );
    expect(deletedUserInList).toBeUndefined();

    console.log(
      "削除されたスタッフがアクティブユーザーリストに含まれていないことを確認"
    );

    console.log("✅ スタッフ削除時の注文データ処理修正テスト完了");
  });

  it("週間注文データ取得時に削除されたスタッフのデータが除外される", async () => {
    console.log("=== 週間注文データ取得時の削除スタッフ除外テスト開始 ===");

    // 1. アクティブなスタッフを追加
    await db.addUser(
      "アクティブスタッフ",
      "active@staff.com",
      "password123",
      2,
      1
    );

    // 2. 削除予定のスタッフを追加
    await db.addUser(
      "削除予定スタッフ",
      "todelete@staff.com",
      "password123",
      2,
      2
    );

    const users = await db.getUsers();
    const activeStaff = users.find(
      (u: User) => u.name === "アクティブスタッフ"
    );
    const toDeleteStaff = users.find(
      (u: User) => u.name === "削除予定スタッフ"
    );

    expect(activeStaff).toBeDefined();
    expect(toDeleteStaff).toBeDefined();

    console.log("テストスタッフ追加完了:", {
      active: activeStaff!.name,
      toDelete: toDeleteStaff!.name,
    });

    // 3. 両方のスタッフで注文を作成
    const items = await db.getItems();
    const testItem = items[0];

    const orderData1 = {
      order_date: "2025-01-20",
      user_id: activeStaff!.id,
      items: [{ item_id: testItem.id, quantity: 1 }],
    };

    const orderData2 = {
      order_date: "2025-01-20",
      user_id: toDeleteStaff!.id,
      items: [{ item_id: testItem.id, quantity: 1 }],
    };

    await db.addOrder(orderData1);
    await db.addOrder(orderData2);

    console.log("両方のスタッフで注文を作成しました");

    // 4. 削除前の週間注文データを取得
    const weeklyOrdersBefore = await db.getOrdersForWeek("2025-01-20");
    expect(weeklyOrdersBefore.length).toBe(2);

    console.log("削除前の週間注文データ:", weeklyOrdersBefore.length, "件");

    // 5. 削除予定スタッフを削除
    await db.deleteUser(toDeleteStaff!.id);

    console.log("削除予定スタッフを削除しました");

    // 6. 削除後の週間注文データを取得
    const weeklyOrdersAfter = await db.getOrdersForWeek("2025-01-20");
    expect(weeklyOrdersAfter.length).toBe(1);
    expect(weeklyOrdersAfter[0].staff_id).toBe(activeStaff!.id);

    console.log("削除後の週間注文データ:", weeklyOrdersAfter.length, "件");
    console.log("残った注文のスタッフID:", weeklyOrdersAfter[0].staff_id);

    console.log("✅ 週間注文データ取得時の削除スタッフ除外テスト完了");
  });

  it("週間注文保存時に削除されたスタッフのデータが除外される", async () => {
    console.log("=== 週間注文保存時の削除スタッフ除外テスト開始 ===");

    // 1. テストスタッフを追加
    await db.addUser(
      "保存テストスタッフ",
      "save@staff.com",
      "password123",
      2,
      1
    );

    const users = await db.getUsers();
    const testStaff = users.find((u: User) => u.name === "保存テストスタッフ");
    expect(testStaff).toBeDefined();

    console.log("保存テストスタッフ:", {
      id: testStaff!.id,
      name: testStaff!.name,
    });

    // 2. 週間注文データを準備（削除前）
    const items = await db.getItems();
    const testItem = items[0];

    const weeklyOrdersData = [
      {
        staff_id: testStaff!.id,
        order_date: "2025-01-22",
        item_id: testItem.id,
        quantity: 1,
      },
    ];

    const payload = {
      orders: weeklyOrdersData,
      staffIdsOnScreen: [testStaff!.id],
      weekStart: "2025-01-20",
      weekEnd: "2025-01-26",
    };

    // 3. 週間注文を保存
    await db.saveWeeklyOrders(payload);

    console.log("週間注文を保存しました");

    // 4. 保存された注文データを確認
    const ordersAfterSave = await db.getOrdersForWeek("2025-01-20");
    expect(ordersAfterSave.length).toBe(1);
    expect(ordersAfterSave[0].staff_id).toBe(testStaff!.id);

    console.log("保存後の注文データ:", ordersAfterSave.length, "件");

    // 5. スタッフを削除
    await db.deleteUser(testStaff!.id);

    console.log("保存テストスタッフを削除しました");

    // 6. 削除されたスタッフを含む注文データで再保存を試行
    const payloadWithDeletedStaff = {
      orders: weeklyOrdersData, // 削除されたスタッフのデータを含む
      staffIdsOnScreen: [testStaff!.id], // 削除されたスタッフIDを含む
      weekStart: "2025-01-20",
      weekEnd: "2025-01-26",
    };

    await db.saveWeeklyOrders(payloadWithDeletedStaff);

    console.log("削除されたスタッフを含むデータで再保存を試行しました");

    // 7. 削除されたスタッフのデータが保存されていないことを確認
    const ordersAfterDeleteAndSave = await db.getOrdersForWeek("2025-01-20");
    expect(ordersAfterDeleteAndSave.length).toBe(0); // 削除されたスタッフのデータは保存されない

    console.log(
      "削除されたスタッフのデータが保存されていないことを確認:",
      ordersAfterDeleteAndSave.length,
      "件"
    );

    console.log("✅ 週間注文保存時の削除スタッフ除外テスト完了");
  });
});
