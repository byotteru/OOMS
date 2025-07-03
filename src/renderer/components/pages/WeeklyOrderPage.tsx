/*C:\Users\byott\Documents\OOMS\src\renderer\components\pages\WeeklyOrderPage.tsx*/

import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../contexts/AppContext";
import Button from "../ui/Button";
import { WeeklyOrderData } from "../../types";
import LoadingIndicator from "../ui/LoadingIndicator";

// フロントエンドで使いやすいように、日付をキーにした注文データの型
interface OrderMap {
  [date: string]: {
    item_id: number;
    quantity: number;
  };
}

// スタッフごとの注文を管理するstateの型
interface StaffOrderState {
  staff_id: number;
  staff_name: string;
  orders: OrderMap;
}

const WeeklyOrderPage: React.FC = () => {
  const { staffList, itemList, isLoading } = useAppContext();

  // 今週の日付を取得する関数（useStateの前に定義）
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の始まりとする
    startOfWeek.setDate(diff);
    return startOfWeek.toISOString().split("T")[0];
  };

  const [currentWeek, setCurrentWeek] = useState<string>(getCurrentWeek());
  const [staffOrders, setStaffOrders] = useState<StaffOrderState[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // 週の日付配列を生成
  const getWeekDays = (weekStart: string) => {
    // ガード節: weekStart が空文字などの場合、空の配列を返して処理を中断
    if (!weekStart) {
      console.warn("getWeekDays: weekStart is empty, returning empty array");
      return [];
    }

    const days = [];
    const startDate = new Date(weekStart);

    // 念のため、無効な日付オブジェクトが生成された場合もチェック
    if (isNaN(startDate.getTime())) {
      console.error("getWeekDays received an invalid date:", weekStart);
      return [];
    }

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("ja-JP", { weekday: "short" }),
        dayNumber: date.getDate(),
      });
    }
    return days;
  };

  // DBから週間注文データを取得し、stateを更新する関数
  const fetchAndSetOrders = useCallback(
    async (week: string) => {
      if (staffList.length === 0) return;
      setIsPageLoading(true);

      try {
        // 1. APIを呼び出して、その週の保存済み注文データを取得
        const savedOrders: WeeklyOrderData[] =
          await window.api.getOrdersForWeek(week);

        // 2. フロントエンドで扱いやすい形式にデータを変換
        const savedOrdersMap: { [staff_id: number]: OrderMap } = {};
        for (const order of savedOrders) {
          if (!savedOrdersMap[order.staff_id]) {
            savedOrdersMap[order.staff_id] = {};
          }
          savedOrdersMap[order.staff_id][order.order_date] = {
            item_id: order.item_id,
            quantity: order.quantity,
          };
        }

        // 3. スタッフリストを元に、stateの初期構造を生成
        const newStaffOrders = staffList
          .filter((staff) => staff.is_active)
          .map((staff) => ({
            staff_id: staff.id,
            staff_name: staff.name,
            // 保存済みのデータがあればそれを使い、なければ空の注文データを入れる
            orders: savedOrdersMap[staff.id] || {},
          }));

        setStaffOrders(newStaffOrders);
      } catch (error) {
        console.error("週間注文の取得に失敗しました:", error);
      } finally {
        setIsPageLoading(false);
      }
    },
    [staffList]
  ); // staffListが変更された時だけ関数を再生成

  // 週が変更されたり、スタッフリストが読み込まれた時にデータを取得
  useEffect(() => {
    fetchAndSetOrders(currentWeek);
  }, [currentWeek, fetchAndSetOrders]);

  // 注文の更新（UI上の操作）
  const updateOrder = (
    staffId: number,
    date: string,
    itemId: number | null,
    quantity: number = 1
  ) => {
    setStaffOrders((prev) =>
      prev.map((staffOrder) => {
        if (staffOrder.staff_id === staffId) {
          const newOrders = { ...staffOrder.orders };
          if (itemId === null) {
            // 「なし」が選択されたら、その日の注文を削除
            delete newOrders[date];
          } else {
            // 弁当が選択されたら、その日の注文を上書き
            newOrders[date] = { item_id: itemId, quantity };
          }
          return { ...staffOrder, orders: newOrders };
        }
        return staffOrder;
      })
    );
  };

  // 週変更
  const changeWeek = (direction: "prev" | "next") => {
    const currentDate = new Date(currentWeek);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newDate.toISOString().split("T")[0]);
  };

  // 注文データの保存
  const saveWeeklyOrders = async () => {
    // DB保存形式のデータ配列を作成
    // 注意：staff_idは実際にはuser_idを指す（usersテーブルのIDを使用）
    const orderList: WeeklyOrderData[] = [];
    staffOrders.forEach((staffOrder) => {
      Object.entries(staffOrder.orders).forEach(([date, order]) => {
        if (order) {
          orderList.push({
            staff_id: staffOrder.staff_id, // これはusers.idを指す
            order_date: date,
            item_id: order.item_id,
            quantity: order.quantity,
          });
        }
      });
    });

    // 表示されている全スタッフのIDリストと週の期間を取得
    const staffIdsOnScreen = staffOrders.map((so) => so.staff_id);
    const weekDays = getWeekDays(currentWeek);
    const weekStart = weekDays[0]?.date;
    const weekEnd = weekDays[6]?.date;

    if (!weekStart || !weekEnd) {
      alert("週の期間を特定できませんでした。");
      return;
    }

    // 新しいペイロード形式でデータを送信
    const payload = {
      orders: orderList,
      staffIdsOnScreen,
      weekStart,
      weekEnd,
    };

    try {
      const result = await window.api.saveWeeklyOrders(payload);
      if (result.success) {
        alert("週間注文を保存しました");
      } else {
        alert("保存に失敗しました: " + result.error);
      }
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    }
  };

  // ローディング表示
  if (isLoading || isPageLoading) {
    return <LoadingIndicator message="注文データを読み込み中..." />;
  }

  const weekDays = getWeekDays(currentWeek);

  // 週間日付の取得に失敗した場合のエラーハンドリング
  if (weekDays.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger">
            <h4>エラー</h4>
            <p>
              週間日付の取得に失敗しました。ページを再読み込みしてください。
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">📝 週間注文管理</h2>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => changeWeek("prev")}
          >
            ← 前週
          </Button>
          <span className="week-display">
            {new Date(currentWeek).toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
            })}
            週
          </span>
          <Button
            variant="secondary"
            size="small"
            onClick={() => changeWeek("next")}
          >
            次週 →
          </Button>
        </div>
      </div>
      <div className="card-body">
        <div className="weekly-order-table">
          <table className="table">
            <thead>
              <tr>
                <th>スタッフ名</th>
                {weekDays.map((day) => (
                  <th key={day.date} className="text-center">
                    {day.dayName}
                    <br />
                    <small>{day.dayNumber}日</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffOrders.map((staffOrder) => (
                <tr key={staffOrder.staff_id}>
                  <td className="staff-name">{staffOrder.staff_name}</td>
                  {weekDays.map((day) => {
                    const order = staffOrder.orders[day.date];
                    return (
                      <td key={day.date} className="order-cell">
                        <select
                          className="form-control order-select"
                          value={order?.item_id || ""}
                          onChange={(e) => {
                            const itemId = e.target.value
                              ? parseInt(e.target.value)
                              : null;
                            updateOrder(staffOrder.staff_id, day.date, itemId);
                          }}
                        >
                          <option value="">なし</option>
                          {itemList
                            .filter((item) => item.is_active)
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} (¥{item.price})
                              </option>
                            ))}
                        </select>
                        {order && (
                          <input
                            type="number"
                            className="form-control quantity-input mt-1"
                            min="1"
                            max="10"
                            value={order.quantity}
                            onChange={(e) => {
                              updateOrder(
                                staffOrder.staff_id,
                                day.date,
                                order.item_id,
                                parseInt(e.target.value) || 1
                              );
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions mt-3">
          <Button variant="primary" onClick={saveWeeklyOrders}>
            💾 週間注文を保存
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOrderPage;
