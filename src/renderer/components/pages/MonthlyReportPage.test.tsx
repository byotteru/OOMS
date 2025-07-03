import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MonthlyReportPage from "./MonthlyReportPage";
import { createCustomRender } from "../../../test/testUtils";

const customRender = createCustomRender();

describe("MonthlyReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    customRender(<MonthlyReportPage />);

    expect(screen.getByText("💰 月次集計（給与控除用）")).toBeInTheDocument();
    expect(screen.getByText("対象月:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CSV出力/ })).toBeInTheDocument();
  });
});
