import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createCustomRender } from "../../../test/testUtils";
import ItemMasterPage from "./ItemMasterPage";

const customRender = createCustomRender();

describe("ItemMasterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", async () => {
    customRender(<ItemMasterPage />);

    await waitFor(
      () => {
        expect(screen.getByText("🍱 弁当管理")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
