import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import LoadingIndicator from "./LoadingIndicator";

describe("LoadingIndicator component", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders with default props", () => {
    const { container } = render(<LoadingIndicator />);
    const indicator = container.querySelector(".loading-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("loading-indicator");
  });

  it("renders with small size", () => {
    const { container } = render(<LoadingIndicator size="small" />);
    const indicator = container.querySelector(".loading-indicator");
    expect(indicator).toHaveClass("loading-small");
  });

  it("renders with large size", () => {
    const { container } = render(<LoadingIndicator size="large" />);
    const indicator = container.querySelector(".loading-indicator");
    expect(indicator).toHaveClass("loading-large");
  });

  it("renders with custom message", () => {
    render(<LoadingIndicator message="カスタムメッセージ" />);
    expect(screen.getByText("カスタムメッセージ")).toBeInTheDocument();
  });

  it("renders with default message when none provided", () => {
    render(<LoadingIndicator />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(
      <LoadingIndicator message="データを読み込んでいます" />
    );
    const indicator = container.querySelector(".loading-indicator");
    expect(indicator).toHaveAttribute("aria-label", "データを読み込んでいます");
  });

  it("renders spinner element", () => {
    const { container } = render(<LoadingIndicator />);
    const spinner = container.querySelector(".spinner");
    expect(spinner).toBeInTheDocument();
  });
});
