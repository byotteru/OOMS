import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createCustomRender } from "../../../test/testUtils";
import LoginPage from "./LoginPage";

const customRender = createCustomRender();

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", async () => {
    const mockOnLogin = vi.fn();
    customRender(<LoginPage onLogin={mockOnLogin} />);

    await waitFor(
      () => {
        expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
