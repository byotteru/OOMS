import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole("button", { name: "閉じる" });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when ESC key is pressed", () => {
    const mockOnClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content for Backdrop Test</div>
      </Modal>
    );

    // backdrop要素を見つけて直接クリック
    const backdrop = container.querySelector(".modal-overlay");
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it("renders with title when provided", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal Content with Title</div>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} size="small">
        <div>Small Modal Content</div>
      </Modal>
    );

    let modal = screen
      .getByText("Small Modal Content")
      .closest('[role="dialog"]');
    expect(modal).toHaveClass("modal-small");

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="large">
        <div>Large Modal Content</div>
      </Modal>
    );

    modal = screen.getByText("Large Modal Content").closest('[role="dialog"]');
    expect(modal).toHaveClass("modal-large");
  });

  it("has proper aria attributes", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Accessible Modal">
        <div>Accessible Modal Content</div>
      </Modal>
    );

    const modal = screen
      .getByText("Accessible Modal Content")
      .closest('[role="dialog"]');
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("aria-labelledby");
  });
});
