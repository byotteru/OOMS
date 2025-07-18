/*C:\Users\byott\Documents\OOMS\src\renderer\components\pages\SettingsPage.tsx*/

import React, { useState, useEffect } from "react";
import { useAppContext } from "../../contexts/AppContext";
import {
  handleApiError,
  showApiError,
  showApiSuccess,
} from "../../utils/apiHelpers";
import Button from "../ui/Button";
import LoadingIndicator from "../ui/LoadingIndicator";

const SettingsPage: React.FC = () => {
  const { settings, isLoading, refreshSettings } = useAppContext();
  const [formData, setFormData] = useState(settings || {});
  const [isSaving, setIsSaving] = useState(false);

  // フォームデータを更新
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 設定を保存
  const handleSaveSettings = async () => {
    if (!formData) return;

    console.log("保存データ:", formData);

    // 管理者パスワードの確認
    if (!formData.admin_password) {
      console.log("警告: 管理者パスワードが未設定です");
      const confirmNoPassword = window.confirm(
        "管理者パスワードが設定されていません。\n" +
          "管理者パスワードを設定しないと、注文のロック解除ができなくなります。\n" +
          "続行しますか？"
      );

      if (!confirmNoPassword) {
        return;
      }
    }

    setIsSaving(true);
    try {
      await window.api.saveSettings(formData);
      console.log("設定保存成功:", {
        ...formData,
        admin_password: formData.admin_password ? "********" : "(未設定)",
      });
      await showApiSuccess("設定を保存しました");
      await refreshSettings(); // 設計書通りの状態同期パターン
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("設定の保存に失敗しました:", apiError);
      await showApiError(apiError);
    } finally {
      setIsSaving(false);
    }
  };

  // 設定をリセット
  const handleResetSettings = () => {
    setFormData(settings || {});
  };

  // 初期データが読み込まれたら、フォームデータを更新
  React.useEffect(() => {
    setFormData(settings || {});
  }, [settings]);

  if (isLoading) {
    return <LoadingIndicator message="設定を読み込み中..." />;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">⚙️ アプリケーション設定</h2>
      </div>
      <div className="card-body">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="settings-section">
            <h3>🏢 施設情報（発注元）</h3>
            <p className="section-description">
              発注書の「発注元」として表示される情報を設定します
            </p>
            <div className="form-group">
              <label htmlFor="garden-name" className="form-label">
                施設名 *
              </label>
              <input
                type="text"
                id="garden-name"
                className="form-control"
                placeholder="例: さくら保育園"
                value={formData.garden_name || ""}
                onChange={(e) =>
                  handleInputChange("garden_name", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="garden-address" className="form-label">
                住所
              </label>
              <textarea
                id="garden-address"
                className="form-control"
                rows={3}
                placeholder="例: 〒000-0000 東京都〇〇区〇〇 1-2-3"
                value={formData.garden_address || ""}
                onChange={(e) =>
                  handleInputChange("garden_address", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="garden-phone" className="form-label">
                電話番号
              </label>
              <input
                type="tel"
                id="garden-phone"
                className="form-control"
                placeholder="例: 03-1234-5678"
                value={formData.garden_phone || ""}
                onChange={(e) =>
                  handleInputChange("garden_phone", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="garden-fax" className="form-label">
                FAX
              </label>
              <input
                type="tel"
                id="garden-fax"
                className="form-control"
                placeholder="例: 03-1234-5679"
                value={formData.garden_fax || ""}
                onChange={(e) =>
                  handleInputChange("garden_fax", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="garden-email" className="form-label">
                メールアドレス
              </label>
              <input
                type="email"
                id="garden-email"
                className="form-control"
                placeholder="例: info@example.com"
                value={formData.garden_email || ""}
                onChange={(e) =>
                  handleInputChange("garden_email", e.target.value)
                }
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>🚚 発注先業者情報（宛名）</h3>
            <p className="section-description">
              発注書の「宛名」として表示される情報を設定します
            </p>
            <div className="form-group">
              <label htmlFor="supplier-name" className="form-label">
                業者名 *
              </label>
              <input
                type="text"
                id="supplier-name"
                className="form-control"
                placeholder="例: 株式会社〇〇フード"
                value={formData.supplier_name || ""}
                onChange={(e) =>
                  handleInputChange("supplier_name", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="supplier-address" className="form-label">
                住所
              </label>
              <textarea
                id="supplier-address"
                className="form-control"
                rows={3}
                placeholder="例: 〒000-0000 東京都〇〇区〇〇 4-5-6"
                value={formData.supplier_address || ""}
                onChange={(e) =>
                  handleInputChange("supplier_address", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="supplier-phone" className="form-label">
                電話番号
              </label>
              <input
                type="tel"
                id="supplier-phone"
                className="form-control"
                placeholder="例: 03-1234-5678"
                value={formData.supplier_phone || ""}
                onChange={(e) =>
                  handleInputChange("supplier_phone", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="supplier-fax" className="form-label">
                FAX
              </label>
              <input
                type="tel"
                id="supplier-fax"
                className="form-control"
                placeholder="例: 03-1234-5679"
                value={formData.supplier_fax || ""}
                onChange={(e) =>
                  handleInputChange("supplier_fax", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="supplier-email" className="form-label">
                メールアドレス
              </label>
              <input
                type="email"
                id="supplier-email"
                className="form-control"
                placeholder="例: info@supplier.com"
                value={formData.supplier_email || ""}
                onChange={(e) =>
                  handleInputChange("supplier_email", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="supplier-website" className="form-label">
                Webサイト
              </label>
              <input
                type="url"
                id="supplier-website"
                className="form-control"
                placeholder="例: https://www.supplier.com"
                value={formData.supplier_website || ""}
                onChange={(e) =>
                  handleInputChange("supplier_website", e.target.value)
                }
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>🔒 システム設定</h3>
            <p className="section-description">システムの管理設定を行います</p>
            <div className="form-group">
              <label htmlFor="admin-password" className="form-label">
                <span style={{ color: "red", fontWeight: "bold" }}>
                  管理者用パスワード *
                </span>
              </label>
              <input
                type="password"
                id="admin-password"
                className="form-control"
                placeholder="注文ロック解除に使用するパスワード"
                value={formData.admin_password || ""}
                onChange={(e) =>
                  handleInputChange("admin_password", e.target.value)
                }
              />
              <small className="form-text text-muted">
                <strong>重要:</strong>{" "}
                このパスワードは週間注文をロックした後に解除する際に必要です。
                必ず設定してください。
              </small>
            </div>
          </div>

          <div className="form-actions">
            <Button
              variant="primary"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? "保存中..." : "💾 設定を保存"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleResetSettings}
              disabled={isSaving}
              className="ml-2"
            >
              🔄 リセット
            </Button>
          </div>
        </form>

        <div className="settings-info">
          <h4>ℹ️ 設定について</h4>
          <ul>
            <li>
              <strong>施設情報</strong>：発注書の「発注元」として印刷されます
            </li>
            <li>
              <strong>発注先業者情報</strong>
              ：発注書の「宛名」として印刷されます
            </li>
            <li>* マークの項目は発注書で重要な情報です</li>
            <li>設定変更は保存後に発注書に反映されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
