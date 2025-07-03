import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createCustomRender } from "../../../test/testUtils";
import WeeklyReportPage from "./WeeklyReportPage";

const customRender = createCustomRender();

describe("WeeklyReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", async () => {
    customRender(<WeeklyReportPage />);

    await waitFor(
      () => {
        expect(screen.getByText("📊 週次発注書")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
