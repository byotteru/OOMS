/*C:\Users\byott\Documents\OOMS\src\renderer\components\pages\MonthlyReportPage.tsx*/

import React, { useState, useEffect } from "react";
import { MonthlyReport } from "../../types";
import {
  handleApiError,
  showApiError,
  showApiSuccess,
} from "../../utils/apiHelpers";
import Button from "../ui/Button";

const MonthlyReportPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // レポートデータを取得
  const fetchReport = async (month: string) => {
    setIsLoading(true);
    try {
      const reportData = await window.api.getMonthlyReport(month);
      setReport(reportData);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("月次レポートの取得に失敗しました:", apiError);
      await showApiError(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchReport(selectedMonth);
  }, [selectedMonth]);

  // CSV出力
  const handleExportCSV = async () => {
    if (!report) return;

    try {
      const csvData = [
        ["スタッフ名", "控除金額"],
        ...report.staff_totals.map((staff) => [
          staff.staff_name,
          staff.total_amount.toString(),
        ]),
        ["合計", report.grand_total.toString()],
      ];

      await window.api.exportCSV(csvData, `月次集計_${selectedMonth}.csv`);
      await showApiSuccess("CSVファイルを出力しました");
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("CSV出力に失敗しました:", apiError);
      await showApiError(apiError);
    }
  };

  // 価格をフォーマット
  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  // 月表示をフォーマット
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    return `${year}年${parseInt(monthNum)}月`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">💰 月次集計（給与控除用）</h2>
        <div className="header-controls">
          <label htmlFor="report-month">対象月:</label>
          <input
            type="month"
            id="report-month"
            className="form-control"
            style={{ width: "auto", display: "inline-block", margin: "0 1rem" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <Button
            variant="primary"
            onClick={handleExportCSV}
            disabled={!report}
          >
            📊 CSV出力
          </Button>
        </div>
      </div>

      <div className="card-body">
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>読み込み中...</p>
          </div>
        ) : report ? (
          <>
            <div className="report-header">
              <h3>月次弁当代集計表</h3>
              <div className="report-month">{formatMonth(selectedMonth)}</div>
            </div>

            <div className="table-responsive">
              <table className="table monthly-report-table">
                <thead>
                  <tr>
                    <th className="staff-header">スタッフ名</th>
                    <th className="amount-header">控除金額</th>
                  </tr>
                </thead>
                <tbody>
                  {report.staff_totals.map((staff, index) => (
                    <tr key={index}>
                      <td className="staff-name">{staff.staff_name}</td>
                      <td className="amount-value">
                        {formatPrice(staff.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td className="total-label">合計</td>
                    <td className="total-amount">
                      {formatPrice(report.grand_total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 詳細表示（将来実装予定）
            <div className="details-section">
              <h4>スタッフ別詳細</h4>
              {report.staff_totals.map((staff, index) => (
                <div key={index} className="staff-detail">
                  <h5>
                    {staff.staff_name}（{formatPrice(staff.total_amount)}）
                  </h5>
                  <p>詳細は今後実装予定</p>
                </div>
              ))}
            </div>
            */}

            <div className="report-footer">
              <div className="footer-info">
                <p>集計日: {new Date().toLocaleDateString("ja-JP")}</p>
                <p>この金額を給与から控除してください。</p>
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

export default MonthlyReportPage;
