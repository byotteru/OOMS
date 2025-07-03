/*C:\Users\byott\Documents\OOMS\src\renderer\components\pages\ItemMasterPage.tsx*/

import React, { useState } from "react";
import { useAppContext, Item } from "../../contexts/AppContext";
import {
  handleApiError,
  showApiError,
  showApiSuccess,
} from "../../utils/apiHelpers";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import LoadingIndicator from "../ui/LoadingIndicator";

interface ItemFormData {
  name: string;
  price: number;
  is_active: number;
  display_order?: number;
}

const ItemMasterPage: React.FC = () => {
  const { itemList, isLoading, refreshItems } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    price: 0,
    is_active: 1,
    display_order: 0,
  });

  // モーダルを開く（新規追加）
  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      price: 0,
      is_active: 1,
      display_order: itemList.length + 1,
    });
    setShowModal(true);
  };

  // モーダルを開く（編集）
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      is_active: item.is_active,
      display_order: item.display_order || 0,
    });
    setShowModal(true);
  };

  // フォーム入力ハンドラー（一元管理）
  const handleInputChange = (
    field: keyof ItemFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await showApiError({
        code: "VALIDATION_ERROR",
        message: "弁当名を入力してください",
      });
      return;
    }

    if (formData.price < 0) {
      await showApiError({
        code: "VALIDATION_ERROR",
        message: "価格は0円以上で入力してください",
      });
      return;
    }

    try {
      if (editingItem) {
        // 更新
        await window.api.updateItem(
          editingItem.id,
          formData.name.trim(),
          formData.price,
          formData.is_active,
          formData.display_order
        );
        await showApiSuccess("弁当情報を更新しました");
      } else {
        // 新規追加
        await window.api.addItem(
          formData.name.trim(),
          formData.price,
          formData.display_order
        );
        await showApiSuccess("弁当を追加しました");
      }

      // データを再読み込み（設計書通りの状態同期パターン）
      await refreshItems();
      handleCloseModal();
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("弁当操作に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  // 弁当削除
  const handleDeleteItem = async (item: Item) => {
    const confirmed = confirm(`「${item.name}」を削除しますか？`);
    if (!confirmed) return;

    try {
      await window.api.deleteItem(item.id);
      await showApiSuccess("弁当を削除しました");
      await refreshItems(); // 設計書通りの状態同期
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("弁当の削除に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  // ステータス切り替え
  const handleToggleStatus = async (item: Item) => {
    const newStatus = item.is_active ? 0 : 1;
    try {
      await window.api.updateItem(
        item.id,
        item.name,
        item.price,
        newStatus,
        item.display_order
      );
      await refreshItems(); // 設計書通りの状態同期
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("ステータス更新に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  // 価格をフォーマット
  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingIndicator message="弁当データを読み込み中..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🍱 弁当管理</h2>
          <Button variant="primary" onClick={handleAddItem}>
            ➕ 弁当追加
          </Button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>弁当名</th>
                  <th>価格</th>
                  <th>表示順</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {itemList
                  .sort(
                    (a, b) => (a.display_order || 0) - (b.display_order || 0)
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td className="price-display">
                        {formatPrice(item.price)}
                      </td>
                      <td>{item.display_order || "-"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            item.is_active ? "status-active" : "status-inactive"
                          }`}
                        >
                          {item.is_active ? "有効" : "無効"}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleEditItem(item)}
                          className="mr-2"
                        >
                          編集
                        </Button>
                        <Button
                          variant="warning"
                          size="small"
                          onClick={() => handleToggleStatus(item)}
                          className="mr-2"
                        >
                          {item.is_active ? "無効化" : "有効化"}
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDeleteItem(item)}
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
        title={editingItem ? "弁当編集" : "弁当追加"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">弁当名</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">価格（円）</label>
            <input
              type="number"
              className="form-control"
              min="0"
              step="1"
              value={formData.price}
              onChange={(e) =>
                handleInputChange("price", parseInt(e.target.value, 10) || 0)
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
                handleInputChange(
                  "display_order",
                  parseInt(e.target.value, 10) || 0
                )
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">状態</label>
            <select
              className="form-control"
              value={formData.is_active}
              onChange={(e) =>
                handleInputChange("is_active", parseInt(e.target.value, 10))
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
              {editingItem ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ItemMasterPage;
