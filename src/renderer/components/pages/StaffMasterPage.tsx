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
  is_active: number;
  display_order?: number;
}

const StaffMasterPage: React.FC = () => {
  const { staffList, isLoading, refreshStaff } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    is_active: 1,
    display_order: 0,
  });

  // モーダルを開く（新規追加）
  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: "",
      is_active: 1,
      display_order: staffList.length + 1,
    });
    setShowModal(true);
  };

  // モーダルを開く（編集）
  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      is_active: staff.is_active,
      display_order: staff.display_order || 0,
    });
    setShowModal(true);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
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
          formData.is_active,
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

  // スタッフ削除（無効化）
  const handleDeleteStaff = async (staff: Staff) => {
    console.log("🗑️ スタッフ削除開始:", { id: staff.id, name: staff.name });

    const confirmed = confirm(`「${staff.name}」を削除（無効化）しますか？`);
    if (!confirmed) {
      console.log("❌ ユーザーがキャンセルしました");
      return;
    }

    console.log("✅ ユーザーが削除を確認しました");

    try {
      console.log("🔄 deleteUser API呼び出し開始...", staff.id);

      // staff.id を使って、新しい deleteUser API を呼び出す
      await window.api.deleteUser(staff.id);

      console.log("✅ deleteUser API呼び出し成功");

      await showApiSuccess("スタッフを無効化しました");

      console.log("🔄 refreshStaff呼び出し開始...");
      await refreshStaff(); // 設計書通りの状態同期

      console.log("✅ refreshStaff完了 - スタッフ一覧更新済み");
    } catch (error) {
      console.error("❌ スタッフ削除処理でエラーが発生:", error);
      const apiError = handleApiError(error);
      console.error("スタッフの無効化に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  // ステータス切り替え
  const handleToggleStatus = async (staff: Staff) => {
    const newStatus = staff.is_active ? 0 : 1;
    try {
      await window.api.updateStaff(
        staff.id,
        staff.name,
        newStatus,
        staff.display_order
      );
      await refreshStaff(); // 設計書通りの状態同期
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("ステータス更新に失敗しました:", apiError);
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
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {staffList
                  .sort(
                    (a, b) => (a.display_order || 0) - (b.display_order || 0)
                  )
                  .map((staff) => (
                    <tr key={staff.id}>
                      <td>{staff.id}</td>
                      <td>{staff.name}</td>
                      <td>{staff.display_order || "-"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            staff.is_active
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {staff.is_active ? "有効" : "無効"}
                        </span>
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
                          variant="warning"
                          size="small"
                          onClick={() => handleToggleStatus(staff)}
                          className="mr-2"
                        >
                          {staff.is_active ? "無効化" : "有効化"}
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
          </div>
          <div className="form-group">
            <label className="form-label">状態</label>
            <select
              className="form-control"
              value={formData.is_active}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_active: Number(e.target.value),
                })
              }
            >
              <option value={1}>有効</option>
              <option value={0}>無効</option>
            </select>
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
};

export default StaffMasterPage;
