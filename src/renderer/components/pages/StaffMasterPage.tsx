/* C:\Users\byott\Documents\OOMS\src\renderer\components\pages\StaffMasterPage.tsx*/

import React, { useState } from "react";
import { useAppContext, Staff } from "../../contexts/AppContext";
import {
  handleApiError,
  showApiError,
  showApiSuccess,
} from "../../utils/apiHelpers";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface StaffFormData {
  name: string;
  display_order?: number;
}

function StaffMasterPage() {
  const { staffList, isLoading, refreshStaff } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    display_order: 0,
  });

  // 表示順に基づいてソートされたスタッフリストを作成
  const sortedStaffList = [...staffList].sort((a, b) => {
    const orderA = a.display_order !== undefined ? a.display_order : 9999;
    const orderB = b.display_order !== undefined ? b.display_order : 9999;
    return orderA - orderB;
  });

  // モーダルを開く（新規追加）
  const handleAddStaff = () => {
    setEditingStaff(null);
    // 新規スタッフの表示順は最後尾+1に設定
    const maxOrder =
      staffList.length > 0
        ? Math.max(...staffList.map((staff) => staff.display_order || 0))
        : 0;
    console.log(`新規スタッフの表示順: ${maxOrder + 1}`);
    setFormData({
      name: "",
      display_order: maxOrder + 1,
    });
    setShowModal(true);
  };

  // モーダルを開く（編集）
  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      display_order: staff.display_order || 0,
    });
    setShowModal(true);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
  };

  // 表示順を上げる（1つ上に移動）
  const handleMoveUp = async (staff: Staff) => {
    // 表示順でソートされたリストでの現在の位置を取得
    const currentIndex = sortedStaffList.findIndex((s) => s.id === staff.id);
    if (currentIndex <= 0) return; // 既に一番上なら何もしない

    const prevStaff = sortedStaffList[currentIndex - 1];
    const currentOrder = staff.display_order || 0;
    const prevOrder = prevStaff.display_order || 0;

    try {
      console.log(
        `移動前: ${staff.name}(${currentOrder}) と ${prevStaff.name}(${prevOrder}) を交換`
      );

      // 表示順を交換
      await window.api.updateStaff(staff.id, staff.name, 1, prevOrder);

      await window.api.updateStaff(
        prevStaff.id,
        prevStaff.name,
        1,
        currentOrder
      );

      console.log(
        `移動後: ${staff.name}(${prevOrder}) と ${prevStaff.name}(${currentOrder})`
      );
      await showApiSuccess("表示順を変更しました");
      await refreshStaff();
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("表示順の変更に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  // 表示順を下げる（1つ下に移動）
  const handleMoveDown = async (staff: Staff) => {
    // 表示順でソートされたリストでの現在の位置を取得
    const currentIndex = sortedStaffList.findIndex((s) => s.id === staff.id);
    if (currentIndex >= sortedStaffList.length - 1) return; // 既に一番下なら何もしない

    const nextStaff = sortedStaffList[currentIndex + 1];
    const currentOrder = staff.display_order || 0;
    const nextOrder = nextStaff.display_order || 0;

    try {
      console.log(
        `移動前: ${staff.name}(${currentOrder}) と ${nextStaff.name}(${nextOrder}) を交換`
      );

      // 表示順を交換
      await window.api.updateStaff(staff.id, staff.name, 1, nextOrder);

      await window.api.updateStaff(
        nextStaff.id,
        nextStaff.name,
        1,
        currentOrder
      );

      console.log(
        `移動後: ${staff.name}(${nextOrder}) と ${nextStaff.name}(${currentOrder})`
      );
      await showApiSuccess("表示順を変更しました");
      await refreshStaff();
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("表示順の変更に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await showApiError({
        code: "VALIDATION_ERROR",
        message: "スタッフ名を入力してください",
      });
      return;
    }

    try {
      if (editingStaff) {
        // 更新
        await window.api.updateStaff(
          editingStaff.id,
          formData.name.trim(),
          1, // 常に有効状態（1）を設定
          formData.display_order
        );
        await showApiSuccess("スタッフ情報を更新しました");
      } else {
        // 新規追加
        await window.api.addStaff(formData.name.trim(), formData.display_order);
        await showApiSuccess("スタッフを追加しました");
      }

      // データを再読み込み（設計書通りの状態同期パターン）
      await refreshStaff();
      handleCloseModal();
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("スタッフ操作に失敗しました:", apiError);
      await showApiError(apiError);
      await window.api.showErrorDialog("エラー", "スタッフ操作に失敗しました");
    }
  };

  // スタッフ完全削除処理
  const handleDeleteStaff = async (staff: Staff) => {
    console.log("🗑️ スタッフ削除開始:", { id: staff.id, name: staff.name });

    const confirmed = confirm(
      `「${staff.name}」を完全に削除しますか？\n\n⚠️ 注意：\n・このスタッフの注文データもすべて削除されます\n・週間発注書から該当データが削除されます\n・この操作は元に戻せません\n\n削除を実行しますか？`
    );
    if (!confirmed) {
      console.log("❌ ユーザーがキャンセルしました");
      return;
    }

    console.log("✅ ユーザーが削除を確認しました");

    try {
      console.log("🔄 deleteUser API呼び出し開始...", staff.id);

      // staff.id を使って、完全削除APIを呼び出す
      const result = await window.api.deleteUser(staff.id);

      console.log("✅ deleteUser API呼び出し成功", result);

      // 削除成功メッセージを表示
      const message =
        result.orderCount && result.orderCount > 0
          ? `スタッフ「${staff.name}」を削除しました。\n関連する注文データ ${result.orderCount} 件も削除されました。`
          : `スタッフ「${staff.name}」を削除しました。`;

      await showApiSuccess(message);

      console.log("🔄 refreshStaff呼び出し開始...");
      await refreshStaff(); // データを再読み込み

      console.log("✅ refreshStaff完了 - スタッフ一覧更新済み");
    } catch (error) {
      console.error("❌ スタッフ削除処理でエラーが発生:", error);
      const apiError = handleApiError(error);
      console.error("スタッフの削除に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">👥 スタッフ管理</h2>
          <Button variant="primary" onClick={handleAddStaff}>
            ➕ スタッフ追加
          </Button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>スタッフ名</th>
                  <th>表示順</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedStaffList.map((staff, index) => (
                  <tr key={staff.id}>
                    <td>{staff.id}</td>
                    <td>{staff.name}</td>
                    <td>
                      {staff.display_order || "-"}
                      <div className="d-flex mt-1">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            console.log(
                              `↑ボタンクリック: ${staff.name} (現在位置: ${index})`
                            );
                            handleMoveUp(staff);
                          }}
                          disabled={index === 0}
                          className="mr-1"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            console.log(
                              `↓ボタンクリック: ${staff.name} (現在位置: ${index})`
                            );
                            handleMoveDown(staff);
                          }}
                          disabled={index === sortedStaffList.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEditStaff(staff)}
                        className="mr-2"
                      >
                        編集
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => {
                          console.log("🖱️ 削除ボタンがクリックされました:", {
                            id: staff.id,
                            name: staff.name,
                          });
                          handleDeleteStaff(staff);
                        }}
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* モーダル */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingStaff ? "スタッフ編集" : "スタッフ追加"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">スタッフ名</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">表示順</label>
            <input
              type="number"
              className="form-control"
              value={formData.display_order || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: Number(e.target.value),
                })
              }
            />
            <small className="form-text text-muted">
              表示順は↑↓ボタンでも変更できます。スタッフリストは表示順に従って自動的にソートされます。
            </small>
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={handleCloseModal}>
              キャンセル
            </Button>
            <Button variant="primary" type="submit">
              {editingStaff ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default StaffMasterPage;
