import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createCustomRender } from "../../../test/testUtils";
import StaffMasterPage from "./StaffMasterPage";

const customRender = createCustomRender();

describe("StaffMasterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", async () => {
    customRender(<StaffMasterPage />);

    await waitFor(
      () => {
        expect(screen.getByText("👥 スタッフ管理")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
