/*C:\Users\byott\Documents\OOMS\src\renderer\components\pages\WeeklyReportPage.tsx*/

import React, { useState, useEffect } from "react";
import { useAppContext } from "../../contexts/AppContext"; // ★ AppContextをインポート
import { WeeklyReport } from "../../types";
import { handleApiError, showApiError } from "../../utils/apiHelpers";
import Button from "../ui/Button";
import LoadingIndicator from "../ui/LoadingIndicator";

const WeeklyReportPage: React.FC = () => {
  const { settings } = useAppContext();
  const [ordererName, setOrdererName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // 今週の月曜日を計算
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return monday.toISOString().split("T")[0];
  });
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // レポートデータを取得
  const fetchReport = async (startDate: string) => {
    setIsLoading(true);
    try {
      const reportData = await window.api.getWeeklyReport(startDate);
      setReport(reportData);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("週次レポートの取得に失敗しました:", apiError);
      await showApiError(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  // 印刷機能
  const handlePrint = () => {
    window.print();
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 期間を表示
  const getPeriodDisplay = () => {
    if (!report) return "";
    // startDate/endDateが利用可能な場合はそれを使用、そうでなければweek_start/week_endから生成
    const startDate = report.startDate || report.week_start;
    const endDate = report.endDate || report.week_end;
    return `${formatDate(startDate)} ～ ${formatDate(endDate)}`;
  };

  // 曜日の短縮名
  const dayNames = ["月", "火", "水", "木", "金", "土", "日"];

  // 週の日付を計算する関数（月曜始まり）
  const getWeekDates = () => {
    if (!report) return [];

    const startDate = new Date(report.week_start);
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">📊 週次発注書</h2>
        <div className="header-controls">
          <label htmlFor="week-start">週開始日:</label>
          <input
            type="date"
            id="week-start"
            className="form-control"
            style={{ width: "auto", display: "inline-block", margin: "0 1rem" }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <label htmlFor="orderer-name" style={{ marginLeft: "1rem" }}>
            発注者名:
          </label>
          <input
            type="text"
            id="orderer-name"
            className="form-control"
            style={{ width: "auto", display: "inline-block", margin: "0 1rem" }}
            value={ordererName}
            onChange={(e) => setOrdererName(e.target.value)}
            placeholder="発注者名を入力"
          />
          <button
            className="button button-primary no-print"
            onClick={handlePrint}
          >
            🖨️ 印刷
          </button>
        </div>
      </div>

      <div className="card-body">
        {isLoading ? (
          <LoadingIndicator message="週次レポートを読み込んでいます..." />
        ) : report ? (
          <>
            <div className="report-header">
              <div className="order-header-info">
                <div className="recipient-info">
                  <strong>宛先:</strong>{" "}
                  {settings?.supplier_name || "（発注先未設定）"} 御中
                  {settings?.supplier_address && (
                    <div className="supplier-address">
                      {settings.supplier_address}
                    </div>
                  )}
                  {settings?.supplier_phone && (
                    <div className="supplier-phone">
                      TEL: {settings.supplier_phone}
                    </div>
                  )}
                  {settings?.supplier_fax && (
                    <div className="supplier-fax">
                      FAX: {settings.supplier_fax}
                    </div>
                  )}
                  {settings?.supplier_email && (
                    <div className="supplier-email">
                      Email: {settings.supplier_email}
                    </div>
                  )}
                </div>
                <div className="sender-info">
                  <strong>発注元:</strong>{" "}
                  {settings?.garden_name || "（施設名未設定）"}
                  {settings?.garden_address && (
                    <div className="garden-address">
                      {settings.garden_address}
                    </div>
                  )}
                  {settings?.garden_phone && (
                    <div className="garden-phone">
                      TEL: {settings.garden_phone}
                    </div>
                  )}
                  {settings?.garden_fax && (
                    <div className="garden-fax">FAX: {settings.garden_fax}</div>
                  )}
                  {settings?.garden_email && (
                    <div className="garden-email">
                      Email: {settings.garden_email}
                    </div>
                  )}
                </div>
              </div>
              <h3>発注書</h3>
              <div className="report-period">
                対象期間: {getPeriodDisplay()}
              </div>
              <div className="standard-message">
                <p>いつもお世話になっております。</p>
                <p>下記の通り、{getPeriodDisplay()}の弁当を発注いたします。</p>
                <p>ご確認のほど、よろしくお願い申し上げます。</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table weekly-report-table">
                <thead>
                  <tr>
                    <th rowSpan={2} className="item-header">
                      弁当名
                    </th>
                    <th colSpan={7} className="week-header">
                      曜日別数量
                    </th>
                    <th rowSpan={2} className="total-header">
                      合計
                    </th>
                  </tr>
                  <tr>
                    {dayNames.map((day, index) => (
                      <th key={day} className="day-header">
                        {day}
                        <br />
                        {weekDates[index]
                          ? formatDate(weekDates[index].toISOString())
                          : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(report.totalSummary || []).map(
                    (
                      summary: { item_name: string; total_quantity: number },
                      index: number
                    ) => (
                      <tr key={index}>
                        <td className="item-name">{summary.item_name}</td>
                        {dayNames.map((_, dayIndex) => {
                          const dayData = report.days?.[dayIndex];
                          const dayItem = dayData?.items.find(
                            (item: { item_name: string; quantity: number }) =>
                              item.item_name === summary.item_name
                          );
                          return (
                            <td key={dayIndex} className="day-quantity">
                              {dayItem?.quantity || 0}
                            </td>
                          );
                        })}
                        <td className="total-quantity">
                          {summary.total_quantity}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="report-footer">
              <div className="footer-info">
                <p>発注日: {new Date().toLocaleDateString("ja-JP")}</p>
                <p>発注者: {ordererName || "（未入力）"}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="card-body">
            <p>レポートデータがありません</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReportPage;
