import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createCustomRender } from "../../../test/testUtils";
import SettingsPage from "./SettingsPage";

const customRender = createCustomRender();

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", async () => {
    customRender(<SettingsPage />);

    await waitFor(
      () => {
        expect(screen.getByText("⚙️ アプリケーション設定")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
