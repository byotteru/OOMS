import React, { useState } from "react";
import { AppContextProvider } from "./contexts/AppContext";
import WeeklyOrderPage from "./components/pages/WeeklyOrderPage";
import StaffMasterPage from "./components/pages/StaffMasterPage";
import ItemMasterPage from "./components/pages/ItemMasterPage";
import WeeklyReportPage from "./components/pages/WeeklyReportPage";
import MonthlyReportPage from "./components/pages/MonthlyReportPage";
import SettingsPage from "./components/pages/SettingsPage";

// ページタイプの定義
type PageType =
  | "weekly-order"
  | "weekly-report"
  | "monthly-report"
  | "staff-master"
  | "item-master"
  | "settings";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>("weekly-order");

  // ナビゲーションボタンの定義
  const navSections = [
    {
      title: "週間業務",
      items: [{ id: "weekly-order", icon: "�", label: "週間注文管理" }],
    },
    {
      title: "集計・レポート",
      items: [
        { id: "weekly-report", icon: "📊", label: "週次発注書" },
        { id: "monthly-report", icon: "💰", label: "月次集計" },
      ],
    },
    {
      title: "マスタ管理",
      items: [
        { id: "staff-master", icon: "👥", label: "スタッフ管理" },
        { id: "item-master", icon: "🍱", label: "弁当管理" },
      ],
    },
    {
      title: "システム",
      items: [{ id: "settings", icon: "⚙️", label: "設定" }],
    },
  ];

  // 現在の日付を取得
  const getCurrentDate = () => {
    return new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  // ページコンテンツを表示する関数
  const renderPageContent = () => {
    switch (currentPage) {
      case "weekly-order":
        return <WeeklyOrderPage />;
      case "weekly-report":
        return <WeeklyReportPage />;
      case "monthly-report":
        return <MonthlyReportPage />;
      case "staff-master":
        return <StaffMasterPage />;
      case "item-master":
        return <ItemMasterPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <div className="card">
            <div className="card-body">ページが見つかりません</div>
          </div>
        );
    }
  };

  return (
    <AppContextProvider>
      <div className="app-container">
        {/* ヘッダー */}
        <header className="app-header">
          <h1 className="app-title">
            <span className="app-icon">🍱</span>
            OOMS - お弁当注文管理システム
          </h1>
          <div className="header-info">
            <span>{getCurrentDate()}</span>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="main-container">
          {/* ナビゲーションメニュー */}
          <nav className="main-nav">
            {navSections.map((section) => (
              <div key={section.title} className="nav-section">
                <h3>{section.title}</h3>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    className={`nav-button ${
                      currentPage === item.id ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(item.id as PageType)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* メインコンテンツエリア */}
          <main className="content-area">{renderPageContent()}</main>
        </div>
      </div>
    </AppContextProvider>
  );
};

export default App;
